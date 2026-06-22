'use client'

import EditableTable from './EditableTable'

export default function SubjectsTab() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Предметы</h2>
      <EditableTable tableDef={{ name: 'subjects', label: 'Предметы', columns: [{ key: 'name', label: 'Название' }] }} />
    </div>
  )
}
