'use client'
import { LayoutProvider } from '@/components/layout/context/useLayoutContext'
import { NotificationProvider } from '@/components/layout/context/useNotificationContext'
import { SessionProvider } from 'next-auth/react'
import type { ReactNode } from 'react'

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <SessionProvider refetchInterval={5 * 60}>
      <LayoutProvider>
        <NotificationProvider>{children}</NotificationProvider>
      </LayoutProvider>
    </SessionProvider>
  )
}

export default Providers
