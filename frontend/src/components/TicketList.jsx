import React from 'react'

// Reusable ticket list with optional onSelect callback
export function TicketList({ tickets, onSelect }) {
  if (!tickets || tickets.length === 0) {
    return <div className="text-sm muted">No tickets found</div>
  }
  return (
    <div className="space-y-3">
      {tickets.map(t => (
        <div
          key={t.id}
          className="p-4 border rounded hover:bg-gray-50 cursor-pointer"
          onClick={() => onSelect && onSelect(t)}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="font-semibold truncate max-w-[60%]" title={t.title}>{t.title}</div>
            <div className="flex gap-2">
              <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">{t.status?.replace('_',' ') || 'open'}</span>
              <span className={`px-2 py-1 rounded text-xs ${t.priority==='high'?'bg-red-100 text-red-600':t.priority==='medium'?'bg-blue-100 text-blue-600':'bg-gray-100 text-gray-600'}`}>{t.priority}</span>
            </div>
          </div>
          <div className="text-xs muted mb-1">Created {new Date(t.createdAt).toLocaleString()}</div>
          <div className="text-xs muted">By {t.creator?.name || 'Unknown'} {t.assignee ? `• Assigned to ${t.assignee.name}` : '• Unassigned'}</div>
        </div>
      ))}
    </div>
  )
}

export default TicketList
