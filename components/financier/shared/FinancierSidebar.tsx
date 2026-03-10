'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  TrendingUp,
  FileText,
  Coins,
  AlertTriangle,
  ShieldCheck,
  CreditCard,
  Wallet,
  BellDot,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export function FinancierSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navGroups: NavGroup[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', href: '/financier/dashboard', icon: LayoutDashboard },
        { label: 'Analytics', href: '/financier/dashboard/analytics', icon: TrendingUp }
      ]
    },
    {
      title: 'Loan Management',
      items: [
        { label: 'Requests', href: '/financier/dashboard/requests', icon: FileText, badge: 5 },
        { label: 'Active Loans', href: '/financier/dashboard/loans', icon: Coins },
        { label: 'Overdue', href: '/financier/dashboard/overdue', icon: AlertTriangle, badge: 3 }
      ]
    },
    {
      title: 'Configuration',
      items: [
        { label: 'Eligibility Rules', href: '/financier/dashboard/eligibility', icon: ShieldCheck },
        { label: 'Financing Plans', href: '/financier/dashboard/plans', icon: CreditCard },
        { label: 'Subsidy Settings', href: '/financier/dashboard/subsidy', icon: Wallet },
        { label: 'Notifications', href: '/financier/dashboard/notifications', icon: BellDot }
      ]
    }
  ];

  const isActive = (href: string) => {
    if (href === '/financier/dashboard') return pathname === href;
    return pathname?.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      const { signOut } = await import('firebase/auth');
      const { auth } = await import('@/firebase');
      await signOut(auth);
      router.push('/financier/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      <div className="lg:hidden fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40" onClick={() => setIsCollapsed(true)} />

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-gray-200
          flex flex-col transition-all duration-300 ease-in-out z-50
          ${isCollapsed ? 'w-20' : 'w-72'}
        `}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
          {!isCollapsed && (
            <Link href="/financier/dashboard" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image
                  src="/Stitches-Africa-Logo-06.png"
                  alt="Stitches Africa"
                  fill
                  className="object-contain group-hover:scale-110 transition-transform"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-gray-900 leading-tight">
                  Financier Portal
                </span>
                <span className="text-xs font-medium text-gray-500">
                  Loan Management
                </span>
              </div>
            </Link>
          )}
          {isCollapsed && (
            <div className="w-full flex justify-center">
              <div className="relative w-8 h-8">
                <Image
                  src="/Stitches-Africa-Logo-06.png"
                  alt="SA"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
          {navGroups.map((group) => (
            <div key={group.title}>
              {!isCollapsed && (
                <h3 className="px-3 mb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        group relative flex items-center gap-3 px-3 py-3 rounded-xl
                        transition-all duration-200
                        ${active
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                        }
                        ${isCollapsed ? 'justify-center' : ''}
                      `}
                      title={isCollapsed ? item.label : undefined}
                    >
                      {/* Active Indicator */}
                      {active && !isCollapsed && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
                      )}

                      {/* Icon */}
                      <Icon
                        className={`flex-shrink-0 ${active ? 'text-blue-600' : 'text-gray-500'} ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`}
                        strokeWidth={2.5}
                      />

                      {/* Label */}
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-sm truncate">{item.label}</span>
                          {item.badge && (
                            <span className="flex items-center justify-center h-5 min-w-[20px] px-2 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}

                      {/* Badge for collapsed state */}
                      {isCollapsed && item.badge && (
                        <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 p-4 space-y-3">
          {!isCollapsed ? (
            <>
              {/* User Info */}
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  SA
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">Stitches Admin</p>
                  <p className="text-xs text-gray-500 truncate">admin@stitches.com</p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all"
              >
                <LogOut className="w-4 h-4" strokeWidth={2.5} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              {/* User Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                SA
              </div>
              {/* Logout Icon */}
              <button
                onClick={handleLogout}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 hidden lg:flex items-center justify-center w-6 h-6 bg-white border border-gray-200 rounded-full text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3 h-3" strokeWidth={3} />
          ) : (
            <ChevronLeft className="w-3 h-3" strokeWidth={3} />
          )}
        </button>
      </aside>
    </>
  );
}
