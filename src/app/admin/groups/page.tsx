'use client'

import { useState, useCallback } from 'react'
import GroupList from '@/components/groups/GroupList'
import GroupForm from '@/components/groups/GroupForm'

export default function AdminGroupsPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingGroup, setEditingGroup] = useState<any>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleEdit = (group: any) => {
    setEditingGroup(group)
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingGroup(null)
    setShowForm(true)
  }

  const handleSaved = useCallback(() => {
    setShowForm(false)
    setRefreshKey(prev => prev + 1)
  }, [])

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Группы</h1>
        <button onClick={handleAdd} className="bg-success text-white px-4 py-2 rounded hover:bg-success">
          + Добавить группу
        </button>
      </div>
      <GroupList key={refreshKey} onEdit={handleEdit} />
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