'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const segmentLabels: Record<string, string> = {
  admin: 'Главная',
  teacher: 'Главная',
  students: 'Ученики',
  groups: 'Группы',
  lessons: 'Уроки',
  tasks: 'Задания',
  finance: 'Финансы',
  reports: 'Отчёты',
  teachers: 'Преподаватели',
  backup: 'Резервное копирование',
}

function isUuid(segment: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)
}

function getContextLabel(prevSegment: string | undefined): string {
  if (prevSegment === 'students') return 'Карточка ученика'
  if (prevSegment === 'groups') return 'Карточка группы'
  if (prevSegment === 'teachers') return 'Карточка преподавателя'
  return 'Просмотр'
}

export default function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length <= 1) return null

  const crumbs: { label: string; href: string }[] = []
  let prevSegment: string | undefined

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const href = '/' + segments.slice(0, i + 1).join('/')

    if (isUuid(segment)) {
      crumbs.push({ label: getContextLabel(prevSegment), href })
    } else if (segmentLabels[segment]) {
      crumbs.push({ label: segmentLabels[segment], href })
    }

    prevSegment = segment
  }

  return (
    <nav className="px-4 py-2 text-sm text-gray-500" aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={crumb.href}>
            {i > 0 && <span className="mx-2 text-gray-400">›</span>}
            {isLast ? (
              <span className="text-gray-900 font-medium">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-brand-600 transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
