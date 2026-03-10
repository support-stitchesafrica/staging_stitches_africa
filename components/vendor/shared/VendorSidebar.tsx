'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingBag,
  Users,
  Wallet,
  Package,
  Bell,
  Settings,
  BarChart3,
  Store,
  Lightbulb
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter
} from '@/components/ui/sidebar';

interface NavigationItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

export function VendorSidebar() {
  const pathname = usePathname();

  const navigationGroups: NavigationGroup[] = [
    {
      label: 'Overview',
      items: [
        {
          title: 'Dashboard',
          href: '/vendor/analytics',
          icon: LayoutDashboard
        }
      ]
    },
    {
      label: 'Analytics',
      items: [
        {
          title: 'Sales',
          href: '/vendor/analytics/sales',
          icon: TrendingUp
        },
        {
          title: 'Orders',
          href: '/vendor/analytics/orders',
          icon: ShoppingBag
        },
        {
          title: 'Store Visibility',
          href: '/vendor/analytics/store',
          icon: Store
        },
        {
          title: 'Recommendations',
          href: '/vendor/recommendations',
          icon: Lightbulb
        }
      ]
    },
    {
      label: 'Management',
      items: [
        {
          title: 'Products',
          href: '/vendor/products',
          icon: Package
        },
        {
          title: 'Customers',
          href: '/vendor/customers',
          icon: Users
        },
        {
          title: 'Inventory',
          href: '/vendor/inventory',
          icon: BarChart3
        }
      ]
    },
    {
      label: 'Financial',
      items: [
        {
          title: 'Payouts',
          href: '/vendor/payouts',
          icon: Wallet
        }
      ]
    },
    {
      label: 'System',
      items: [
        {
          title: 'Notifications',
          href: '/vendor/notifications',
          icon: Bell
        },
        {
          title: 'Settings',
          href: '/vendor/settings',
          icon: Settings
        }
      ]
    }
  ];

  const isActive = (href: string) => {
    if (href === '/vendor/analytics') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-gray-200 pb-4">
        <div className="px-4">
          <h2 className="text-lg font-bold text-gray-900">Vendor Portal</h2>
          <p className="text-sm text-gray-600">Analytics & Management</p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navigationGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active}>
                        <Link href={item.href}>
                          <Icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs font-medium text-white">
                              {item.badge > 9 ? '9+' : item.badge}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 pt-4">
        <div className="px-4 text-xs text-gray-500">
          <p>© 2024 Stitches Africa</p>
          <p className="mt-1">Vendor Analytics v2.0</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
