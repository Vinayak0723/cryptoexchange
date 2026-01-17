import React from 'react';

export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`${sizes[size]} border-exchange-border border-t-primary-500 rounded-full animate-spin ${className}`}
    />
  );
};

export const LoadingPage = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <LoadingSpinner size="lg" />
      <span className="text-exchange-muted">{message}</span>
    </div>
  );
};

export const LoadingSkeleton = ({ className = '' }) => {
  return <div className={`skeleton ${className}`} />;
};

export default LoadingSpinner;