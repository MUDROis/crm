'use client'

import { useState } from 'react'
import GroupList from '@/components/groups/GroupList'
import GroupForm from '@/components/groups/GroupForm'

export default function AdminGroupsPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingGroup, setEditingGroup] = useState<any>(null)

  const handleEdit = (group: any) => {
    setEditingGroup(group)
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingGroup(null)
    setShowForm(true)
  }

  const handleSaved = () => {
    setShowForm(false)
    window.location.reload()
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Группы</h1>
        <button onClick={handleAdd} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          + Добавить группу
        </button>
      </div>
      <GroupList onEdit={handleEdit} />
      {showForm && (
        <GroupForm
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
          group={editingGroup}
        />
      )}
    </div>
  )
}