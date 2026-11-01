import React from 'react';

const statusConfig = {
  AVAILABLE: {
    label: 'Available',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  RESERVED: {
    label: 'Reserved',
    className: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  INACTIVE: {
    label: 'Inactive',
    className: 'bg-slate-100 text-slate-700 border-slate-200'
  },
  SCHEDULED: {
    label: 'Scheduled Pickup',
    className: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  PENDING: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  ACCEPTED: {
    label: 'Accepted',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  REJECTED: {
    label: 'Declined',
    className: 'bg-rose-100 text-rose-800 border-rose-200'
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-slate-100 text-slate-700 border-slate-200'
  }
};

export const StatusBadge = ({ status, size = 'md' }) => {
  const config = statusConfig[status] || {
    label: status,
    className: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs sm:text-sm px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.className} ${sizeClasses}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70"></span>
      {config.label}
    </span>
  );
};
