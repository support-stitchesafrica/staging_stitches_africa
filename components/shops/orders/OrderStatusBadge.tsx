'use client';

interface OrderStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export function OrderStatusBadge({ status, size = 'md' }: OrderStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        label: 'Pending',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: '⏳',
      },
      processing: {
        label: 'Processing',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: '⚙️',
      },
      production: {
        label: 'In Production',
        className: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        icon: '🔨',
      },
      shipped: {
        label: 'Shipped',
        className: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: '🚚',
      },
      delivered: {
        label: 'Delivered',
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: '✅',
      },
      cancelled: {
        label: 'Cancelled',
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: '❌',
      },
      refunded: {
        label: 'Refunded',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: '💰',
      },
    };

    return configs[status as keyof typeof configs] || {
      label: status.charAt(0).toUpperCase() + status.slice(1),
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: '📦',
    };
  };

  const getSizeClasses = (size: string) => {
    const sizes = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-2.5 py-1.5 text-sm',
      lg: 'px-3 py-2 text-base',
    };
    return sizes[size as keyof typeof sizes] || sizes.md;
  };

  const config = getStatusConfig(status);
  const sizeClasses = getSizeClasses(size);

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        ${config.className}
        ${sizeClasses}
      `}
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
}