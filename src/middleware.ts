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

  // Не вошёл и не на странице входа → на вход
  if (!user && !url.pathname.startsWith('/login')) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    // Получаем профиль с защитой от ошибок
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle() // не падает, если записи нет

    if (error || !profile) {
      // Если профиль не найден, разлогиниваем и показываем ошибку
      const logoutUrl = request.nextUrl.clone()
      logoutUrl.pathname = '/login'
      logoutUrl.searchParams.set('error', 'profile_not_found')
      const response = NextResponse.redirect(logoutUrl)
      // Удаляем сессию
      await supabase.auth.signOut()
      return response
    }

    // Если зашёл на /login, а уже авторизован → в кабинет
    if (url.pathname === '/login') {
      url.pathname = profile.role === 'admin' ? '/admin' : '/teacher'
      return NextResponse.redirect(url)
    }

    // Проверка роли
    if (url.pathname.startsWith('/admin') && profile.role !== 'admin') {
      url.pathname = '/teacher'
      return NextResponse.redirect(url)
    }
    if (url.pathname.startsWith('/teacher') && profile.role === 'admin') {
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}