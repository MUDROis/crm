import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // Если не вошёл и не на странице входа → отправляем на вход
  if (!user && !url.pathname.startsWith('/login')) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    // Пробуем получить роль из базы
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    // Вывод в терминал для диагностики
    console.log('🔍 Middleware profile check:', {
      userId: user.id,
      profile,
      error: error?.message
    })

    if (error) {
      console.error('❌ Ошибка при получении профиля:', error)
      // Если не можем получить профиль – разлогиниваем и показываем ошибку
      const logoutUrl = request.nextUrl.clone()
      logoutUrl.pathname = '/login'
      logoutUrl.searchParams.set('error', 'profile_fetch_error')
      const response = NextResponse.redirect(logoutUrl)
      await supabase.auth.signOut()
      return response
    }

    // Редирект после логина
    if (url.pathname === '/login') {
      url.pathname = profile?.role === 'admin' ? '/admin' : '/teacher'
      return NextResponse.redirect(url)
    }

    // Защита: админ не может в /teacher, учитель – в /admin
    if (url.pathname.startsWith('/admin') && profile?.role !== 'admin') {
      url.pathname = '/teacher'
      return NextResponse.redirect(url)
    }
    if (url.pathname.startsWith('/teacher') && profile?.role === 'admin') {
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}