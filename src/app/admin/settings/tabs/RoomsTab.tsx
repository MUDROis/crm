'use client'

import EditableTable from './EditableTable'

export default function RoomsTab() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Кабинеты</h2>
      <EditableTable tableDef={{ name: 'rooms', label: 'Кабинеты', columns: [{ key: 'name', label: 'Название' }] }} />
    </div>
  )
}
