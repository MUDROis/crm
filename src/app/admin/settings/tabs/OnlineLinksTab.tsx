'use client'

import EditableTable from './EditableTable'

export default function OnlineLinksTab() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Ссылки на онлайн-занятия</h2>
      <EditableTable
        tableDef={{
          name: 'online_links',
          label: 'Ссылки на онлайн-занятия',
          columns: [
            { key: 'name', label: 'Название' },
            { key: 'url', label: 'URL' },
          ],
        }}
      />
    </div>
  )
}
