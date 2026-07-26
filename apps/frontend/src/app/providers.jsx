'use client'

import { LayoutProvider } from '@/components/layout/context/useLayoutContext'
import { NotificationProvider } from '@/components/layout/context/useNotificationContext'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const Providers = ({ children }) => {
  const router = useRouter()
  const { isAuthenticated, isAuthReady } = useAuth()
  useEffect(() => {
    if (isAuthReady && !isAuthenticated) {
      router.replace('/auth/sign-in')
    }
  }, [isAuthReady, isAuthenticated, router])
  return (
    <LayoutProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </LayoutProvider>
  )
}

export default Providers
