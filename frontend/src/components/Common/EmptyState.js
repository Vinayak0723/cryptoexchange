import React from 'react';
import { InboxIcon } from '@heroicons/react/24/outline';

const EmptyState = ({
  icon: Icon = InboxIcon,
  title = 'No data',
  description = '',
  action = null
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <Icon className="w-12 h-12 text-exchange-muted mb-4" />
      <h3 className="text-lg font-medium text-exchange-text mb-2">{title}</h3>
      {description && (
        <p className="text-exchange-muted text-sm max-w-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  );
};

export default EmptyState;