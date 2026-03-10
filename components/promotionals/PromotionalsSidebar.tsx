'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { usePromotionalsAuth } from '@/contexts/PromotionalsAuthContext';
import
    {
        LayoutDashboard,
        Tag,
        LogOut,
        Menu,
        X,
        ChevronLeft,
        ChevronRight,
        Users
    } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NavItem
{
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    requiresPermission?: boolean;
}

export function PromotionalsSidebar()
{
    const pathname = usePathname();
    const router = useRouter();
    const { promotionalUser, logout, hasPermission } = usePromotionalsAuth();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Check if user can manage team (Super Admin only)
    const canManageTeam = hasPermission('canManageTeam');

    // Build navigation items dynamically based on permissions
    const navItems: NavItem[] = [
        {
            label: 'Dashboard',
            href: '/promotionals',
            icon: LayoutDashboard,
        },
        {
            label: 'Create Event',
            href: '/promotionals/create',
            icon: Tag,
        },
        ...(canManageTeam ? [{
            label: 'Team',
            href: '/promotionals/team',
            icon: Users,
            requiresPermission: true,
        }] : []),
    ];

    const handleLogout = async () =>
    {
        try
        {
            setIsLoggingOut(true);
            await logout();
            toast.success('Logged out successfully');
            router.push('/promotionals/auth');
        } catch (error)
        {
            console.error('Logout error:', error);
            toast.error('Failed to logout. Please try again.');
        } finally
        {
            setIsLoggingOut(false);
        }
    };

    const toggleMobileSidebar = () =>
    {
        setIsMobileOpen(!isMobileOpen);
    };

    const closeMobileSidebar = () =>
    {
        setIsMobileOpen(false);
    };

    const toggleCollapse = () =>
    {
        setIsCollapsed(!isCollapsed);
    };

    // Check if path is active
    const isActive = (href: string) =>
    {
        if (href === '/promotionals')
        {
            return pathname === href;
        }
        return pathname?.startsWith(href);
    };

    // Get role display information
    const getRoleInfo = () =>
    {
        if (!promotionalUser?.role) return null;

        const roleConfig = {
            superadmin: {
                label: 'Super Admin',
                color: 'bg-purple-600/10 text-purple-700 border-purple-200',
                description: 'Full access to all features including team management',
            },
            admin: {
                label: 'Admin',
                color: 'bg-blue-600/10 text-blue-700 border-blue-200',
                description: 'Can create, edit, delete, and publish events',
            },
            editor: {
                label: 'Editor',
                color: 'bg-green-600/10 text-green-700 border-green-200',
                description: 'Can create and edit events',
            },
        };

        return roleConfig[promotionalUser.role];
    };

    const roleInfo = getRoleInfo();

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={toggleMobileSidebar}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
                aria-label="Toggle menu"
            >
                {isMobileOpen ? (
                    <X className="h-6 w-6 text-gray-700" />
                ) : (
                    <Menu className="h-6 w-6 text-gray-700" />
                )}
            </button>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    onClick={closeMobileSidebar}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed top-0 left-0 h-screen bg-white border-r border-gray-200 flex flex-col z-40 transition-all duration-300 ease-in-out',
                    isCollapsed ? 'w-16' : 'w-64',
                    isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                {/* Logo Section */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    {!isCollapsed && (
                        <Link href="/promotionals" onClick={closeMobileSidebar} className="flex items-center gap-2">
                            <Image
                                src="/Stitches-Africa-Logo-06.png"
                                alt="Stitches Africa"
                                width={32}
                                height={32}
                                className="rounded"
                            />
                            <span className="text-lg font-bold text-gray-900">
                                Promotionals
                            </span>
                        </Link>
                    )}
                    {isCollapsed && (
                        <div className="flex items-center justify-center w-full">
                            <Image
                                src="/Stitches-Africa-Logo-06.png"
                                alt="SA"
                                width={32}
                                height={32}
                                className="rounded"
                            />
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-2">
                    <ul className="space-y-1">
                        {navItems.map((item) =>
                        {
                            const Icon = item.icon;
                            const active = isActive(item.href);

                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={closeMobileSidebar}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                                            active
                                                ? 'bg-purple-600/10 text-purple-700 font-medium'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                                            isCollapsed ? 'justify-center' : ''
                                        )}
                                        title={isCollapsed ? item.label : undefined}
                                    >
                                        <Icon className="w-5 h-5 flex-shrink-0" />
                                        {!isCollapsed && (
                                            <span className="text-sm font-medium">{item.label}</span>
                                        )}
                                        {active && !isCollapsed && (
                                            <div className="ml-auto w-1 h-6 bg-purple-600 rounded-full" />
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* User Info and Actions */}
                <div className="p-2 border-t border-gray-200 space-y-1">
                    {/* User Info */}
                    {!isCollapsed && promotionalUser && (
                        <div className="px-3 py-2 text-xs text-gray-600 space-y-1.5">
                            <div className="font-medium text-gray-900 truncate">
                                {promotionalUser.fullName}
                            </div>
                            <div className="truncate">{promotionalUser.email}</div>
                            {roleInfo && (
                                <div className={cn(
                                    'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border',
                                    roleInfo.color
                                )}>
                                    {roleInfo.label}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                            'text-gray-600 hover:bg-red-50 hover:text-red-600',
                            'transition-all duration-200',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            isCollapsed ? 'justify-center' : ''
                        )}
                        title={isCollapsed ? 'Logout' : undefined}
                    >
                        <LogOut className="w-5 h-5" />
                        {!isCollapsed && (
                            <span className="text-sm font-medium">
                                {isLoggingOut ? 'Logging out...' : 'Logout'}
                            </span>
                        )}
                    </button>

                    {/* Collapse Toggle Button - Desktop Only */}
                    <button
                        onClick={toggleCollapse}
                        className={cn(
                            'hidden lg:flex w-full items-center gap-3 px-3 py-2.5 rounded-lg',
                            'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                            'transition-all duration-200',
                            isCollapsed ? 'justify-center' : ''
                        )}
                        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {isCollapsed ? (
                            <ChevronRight className="w-5 h-5" />
                        ) : (
                            <>
                                <ChevronLeft className="w-5 h-5" />
                                <span className="text-sm font-medium">Collapse</span>
                            </>
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
}
