import React from 'react';

const STATUS_META = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-800' },
  assigned: { label: 'Assigned', color: 'bg-purple-100 text-purple-800' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800' },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800' }
};

const StatusBadge = ({ status = '' }) => {
  const normalized = status.toLowerCase().replace('-', '_');
  const meta = STATUS_META[normalized] || { label: status.replace(/[_-]/g, ' ') || 'Unknown', color: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${meta.color}`}>
      {meta.label}
    </span>
  );
};

export default StatusBadge;
