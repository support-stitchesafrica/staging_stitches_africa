/**
 * Marketing Mobile Menu Component
 * Mobile-friendly navigation menu
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem
{
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ElementType;
    badge?: string;
}

interface MobileMenuProps
{
    items: MenuItem[];
    title?: string;
    className?: string;
}

export function MobileMenu({ items, title = 'Menu', className }: MobileMenuProps)
{
    const [isOpen, setIsOpen] = useState(false);

    const handleItemClick = (item: MenuItem) =>
    {
        if (item.onClick)
        {
            item.onClick();
        }
        setIsOpen(false);
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className={cn('md:hidden', className)}>
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                    <SheetTitle>{title}</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-6">
                    {items.map((item, index) =>
                    {
                        const Icon = item.icon;
                        return (
                            <button
                                key={index}
                                onClick={() => handleItemClick(item)}
                                className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-accent transition-colors text-left"
                            >
                                <div className="flex items-center gap-3">
                                    {Icon && <Icon className="h-5 w-5" />}
                                    <span className="font-medium">{item.label}</span>
                                </div>
                                {item.badge && (
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </SheetContent>
        </Sheet>
    );
}
