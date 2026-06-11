'use client'

import TaskList from '@/components/tasks/TaskList'

export default function TeacherTasksPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Мои задачи</h1>
      <TaskList role="teacher" />
    </div>
  )
}