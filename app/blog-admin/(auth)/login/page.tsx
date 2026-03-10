"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoginForm } from '@/components/blog-admin/auth/LoginForm'
import { RegisterForm } from '@/components/blog-admin/auth/RegisterForm'
import { BlogAuthProvider, useBlogAuth } from '@/contexts/BlogAuthContext'

function BlogLoginContent() {
  const [showRegister, setShowRegister] = useState(false)
  const { user, loading } = useBlogAuth()
  const router = useRouter()

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/blog-admin')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {showRegister ? (
          <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
        ) : (
          <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
        )}
      </div>
    </div>
  )
}

export default function BlogLoginPage() {
  return (
    <BlogAuthProvider>
      <BlogLoginContent />
    </BlogAuthProvider>
  )
}