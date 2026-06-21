'use client'

import TaskList from '@/components/tasks/TaskList'

export default function TeacherTasksPage() {
  return (
    <div className="p-6">
      <TaskList role="teacher" />
    </div>
  )
}