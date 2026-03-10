"use client"

import { ReactNode } from 'react'
import { useBlogAuth } from '@/contexts/BlogAuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Shield } from 'lucide-react'
import type { BlogPermission } from '@/types/blog-admin'

interface AuthGuardProps {
  children: ReactNode
  requiredPermission?: BlogPermission
  fallback?: ReactNode
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requiredPermission,
  fallback 
}) => {
  const { user, loading, hasPermission } = useBlogAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return fallback || (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="text-center py-8">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
          <p className="text-gray-600">Please sign in to access this page.</p>
        </CardContent>
      </Card>
    )
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="text-center py-8">
          <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-gray-600">
            You don't have permission to access this feature.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Required permission: {requiredPermission}
          </p>
        </CardContent>
      </Card>
    )
  }

  return <>{children}</>
}