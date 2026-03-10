'use client';

import { useAgentAuth } from '@/contexts/AgentAuthContext';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Bell, Settings, LogOut, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Dynamically import sidebar to reduce initial bundle size
const AgentSidebar = dynamic(() =>
  import('@/components/agent/AgentSidebar').then((mod) => mod.AgentSidebar), {
  ssr: false,
  loading: () => <div className="w-64 bg-slate-100 dark:bg-slate-800 animate-pulse" />
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Handle server-side rendering
  if (typeof window === 'undefined') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  const { user, agentData, loading, isAgent, signOut } = useAgentAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // User is not logged in, redirect to login
      router.push('/agent/login');
      return;
    }
    
    if (!loading && user && !isAgent) {
      // User is logged in but not an agent
      console.error('User is not authorized as an agent');
      // You could redirect to an unauthorized page or show an error
    }
  }, [user, isAgent, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAgent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center max-w-md p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground mb-4">Checking authentication...</p>
          <div className="text-xs text-muted-foreground space-y-1 mb-4">
            <p>User: {user ? '✅ Logged in' : '❌ Not logged in'}</p>
            <p>Agent: {isAgent ? '✅ Authorized' : '❌ Not authorized'}</p>
            {user && !isAgent && (
              <p className="text-red-600 mt-2">
                Your account is not authorized as an agent.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Button 
              onClick={() => router.push('/agent/login')}
              variant="outline"
              className="w-full"
            >
              Go to Login
            </Button>
            <Button 
              onClick={() => window.location.reload()}
              variant="ghost"
              className="w-full"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <AgentSidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-slate-900/95 dark:supports-[backdrop-filter]:bg-slate-900/60 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          {/* Mobile menu button */}
          <div className="lg:hidden">
            <AgentSidebar />
          </div>

          {/* Search */}
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex flex-1 items-center">
              <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 pl-3" />
              <Input
                className="pl-10 sm:text-sm border-0 bg-slate-100 dark:bg-slate-800"
                placeholder="Search products, vendors, orders..."
                type="search"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            {/* Notifications */}
            <span  className="relative bg-trasparent">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                3
              </Badge>
            </span>

            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {agentData?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {agentData?.name || 'Agent'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {agentData?.email}
                    </p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {agentData?.role}
                      </Badge>
                      {agentData?.territory && (
                        <Badge variant="outline" className="text-xs">
                          {agentData.territory}
                        </Badge>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <UserCheck className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
