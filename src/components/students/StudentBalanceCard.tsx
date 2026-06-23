'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Balance {
  remaining_lessons: number
  remaining_rubles: number
  total_lessons: number
  paid: number
}

export default function StudentBalanceCard({ studentId }: { studentId: string }) {
  const [balance, setBalance] = useState<Balance>({ remaining_lessons: 0, remaining_rubles: 0, total_lessons: 0, paid: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadBalance()
  }, [studentId])

  async function loadBalance() {
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (!subs || subs.length === 0) {
      setLoading(false)
      return
    }

    const activeSubs = subs.filter((s: any) => s.remaining_lessons > 0)
    if (activeSubs.length === 0) {
      setLoading(false)
      return
    }

    const subIds = activeSubs.map((s: any) => s.id)
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .in('subscription_id', subIds)
      .eq('type', 'subscription')

    let totalPaid = 0
    let totalRemainingLessons = 0
    let totalLessons = 0

    for (const sub of activeSubs) {
      const subPayments = (payments || []).filter((p: any) => p.subscription_id === sub.id)
      const paid = subPayments.length > 0
        ? subPayments.reduce((sum: number, p: any) => sum + p.amount, 0)
        : (sub.cost || 0)

      totalPaid += paid
      totalRemainingLessons += sub.remaining_lessons
      totalLessons += sub.total_lessons
    }

    const costPerLesson = totalLessons > 0 ? totalPaid / totalLessons : 0
    const remainingRubles = totalRemainingLessons * costPerLesson

    setBalance({ remaining_lessons: totalRemainingLessons, remaining_rubles: remainingRubles, total_lessons: totalLessons, paid: totalPaid })
    setLoading(false)
  }

  if (loading) return null

  if (balance.remaining_lessons === 0 && balance.paid === 0) return null

  return (
    <div className="mt-3 flex gap-4">
      <div className="bg-brand-50 border border-brand-200 rounded-lg px-4 py-2 text-center min-w-[120px]">
        <div className="text-2xl font-bold text-brand-700">{balance.remaining_lessons}</div>
        <div className="text-xs text-gray-600">осталось занятий</div>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-center min-w-[120px]">
        <div className="text-2xl font-bold text-green-700">{Math.round(balance.remaining_rubles).toLocaleString()} ₽</div>
        <div className="text-xs text-gray-600">остаток по сумме</div>
      </div>
    </div>
  )
}
