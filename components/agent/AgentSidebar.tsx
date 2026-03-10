'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAgentAuth } from '@/contexts/AgentAuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Home,
  Package,
  Users,
  Settings,
  LogOut,
  Menu,
  ChevronDown,
  Bell,
  Search,
  Plus,
  BarChart3,
  MessageSquare,
  ShoppingBag,
  UserCheck,
  Briefcase
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  badge?: string;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/agent/dashboard',
    icon: Home,
  },
  {
    title: 'Products',
    href: '/agent/dashboard/products',
    icon: Package,
    permission: 'view_products',
    children: [
      {
        title: 'All Products',
        href: '/agent/dashboard/products',
        icon: Package,
        permission: 'view_products',
      },
      {
        title: 'Create Product',
        href: '/agent/dashboard/products/create',
        icon: Plus,
        permission: 'create_products',
      },
    ],
  },
  {
    title: 'Vendors',
    href: '/agent/dashboard/vendors',
    icon: Users,
    permission: 'view_tailors',
  },
  {
    title: 'Analytics',
    href: '/agent/dashboard/analytics',
    icon: BarChart3,
    permission: 'view_analytics',
  },
  {
    title: 'Chat Support',
    href: '/agent/dashboard/chat',
    icon: MessageSquare,
    permission: 'handle_chat',
    badge: '3',
  },
  {
    title: 'Orders',
    href: '/agent/dashboard/orders',
    icon: ShoppingBag,
    permission: 'view_orders',
  },
  {
    title: 'Settings',
    href: '/agent/dashboard/settings',
    icon: Settings,
  },
];

interface SidebarProps {
  className?: string;
}

export function AgentSidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { agentData, hasPermission, signOut } = useAgentAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev =>
      prev.includes(href)
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  const filteredNavigation = navigation.filter(item =>
    !item.permission || hasPermission(item.permission)
  );

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Briefcase className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Agent Portal</span>
            <span className="text-xs text-muted-foreground">Stitches Africa</span>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="border-b p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start p-2 h-auto">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {agentData?.name?.charAt(0)?.toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3 flex-1 text-left">
                <p className="text-sm font-medium">{agentData?.name || 'Agent'}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {agentData?.role || 'agent'}
                  </Badge>
                  {agentData?.territory && (
                    <Badge variant="outline" className="text-xs">
                      {agentData.territory}
                    </Badge>
                  )}
                </div>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserCheck className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const isExpanded = expandedItems.includes(item.href);
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.href}>
              <div className="relative">
                {hasChildren ? (
                  <span
                    
                    className={cn(
                      'w-full flex justify-start',
                      isActive && 'bg-primary/10 text-primary'
                    )}
                    onClick={() => toggleExpanded(item.href)}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.title}
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {item.badge}
                      </Badge>
                    )}
                    <ChevronDown
                      className={cn(
                        'ml-auto h-4 w-4 transition-transform',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  </span>
                ) : (
                  <Link href={item.href}>
                    <span
                      
                      className={cn(
                        'w-full flex justify-start',
                        isActive && 'bg-primary/10 text-primary'
                      )}
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      {item.title}
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </span>
                  </Link>
                )}
              </div>

              {/* Children */}
              {hasChildren && isExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children?.filter(child =>
                    !child.permission || hasPermission(child.permission)
                  ).map((child) => {
                    const isChildActive = pathname === child.href;
                    return (
                      <Link key={child.href} href={child.href}>
                        <span
                          className={cn(
                            'w-full flex justify-start',
                            isChildActive && 'bg-primary/10 text-primary'
                          )}
                        >
                          <child.icon className="mr-3 h-3 w-3" />
                          {child.title}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>v1.0.0</span>
          <Button variant="ghost" size="sm">
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn('hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0', className)}>
        <div className="flex flex-col flex-grow bg-white dark:bg-slate-900 border-r">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="bg-white dark:bg-slate-900 h-full">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}