'use client';

import { Settings, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import
{
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationBell } from './notifications/NotificationBell';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';
import { useRouter } from 'next/navigation';

export function MarketingHeader()
{
    const { marketingUser, signOut } = useMarketingAuth();
    const router = useRouter();

    const handleLogout = async () =>
    {
        await signOut();
        router.push('/marketing/login');
    };

    if (!marketingUser)
    {
        return null;
    }

    const formatRoleName = (role: string): string =>
    {
        return role
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold">Marketing Dashboard</h2>
                </div>

                <div className="flex items-center gap-2">
                    <NotificationBell />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative">
                                <User className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{marketingUser.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {marketingUser.email}
                                    </p>
                                    <p className="text-xs leading-none text-muted-foreground mt-1">
                                        {formatRoleName(marketingUser.role)}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/marketing/settings" className="cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/marketing/notifications" className="cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Notifications
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
