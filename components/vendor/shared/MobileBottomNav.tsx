'use client';

import { usePathname, useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Package, 
  Users, 
  DollarSign, 
  Bell,
  MoreHorizontal 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems: NavItem[] = [
    {
      label: 'Analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      path: '/vendor/analytics'
    },
    {
      label: 'Products',
      icon: <Package className="h-5 w-5" />,
      path: '/vendor/products'
    },
    {
      label: 'Customers',
      icon: <Users className="h-5 w-5" />,
      path: '/vendor/customers'
    },
    {
      label: 'Payouts',
      icon: <DollarSign className="h-5 w-5" />,
      path: '/vendor/payouts'
    },
    {
      label: 'More',
      icon: <MoreHorizontal className="h-5 w-5" />,
      path: '/vendor/dashboard'
    }
  ];

  const isActive = (path: string) => {
    return pathname?.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 transition-colors relative',
              isActive(item.path)
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
            {item.badge && item.badge > 0 && (
              <span className="absolute top-2 right-1/4 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
            {isActive(item.path) && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
