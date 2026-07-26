'use client'

import MainLayout from '@/components/layout/shell/MainLayout'
import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { useAuth } from '../hooks/use-auth'

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const router = useRouter()
  const { isAuthenticated, isAuthReady } = useAuth()

  useEffect(() => {
    if (isAuthReady && !isAuthenticated) {
      router.replace('/auth/sign-in')
    }
  }, [isAuthReady, isAuthenticated, router])

  if (!isAuthReady || !isAuthenticated) {
    return null
  }

  return <MainLayout>{children}</MainLayout>
}

export default RequireAuth
