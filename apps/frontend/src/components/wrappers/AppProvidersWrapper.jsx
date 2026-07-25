'use client'

import { LayoutProvider } from '@/context/useLayoutContext'
import { NotificationProvider } from '@/context/useNotificationContext'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
const AppProvidersWrapper = ({ children }) => {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/sign-in')
    }
  }, [])
  return (
    <LayoutProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </LayoutProvider>
  )
}
export default AppProvidersWrapper
