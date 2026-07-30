'use client'
import { LayoutProvider } from '@/components/layout/context/useLayoutContext'
import { NotificationProvider } from '@/components/layout/context/useNotificationContext'
import { QueryProvider } from '@/lib/query'
import { SessionProvider } from 'next-auth/react'
import type { ReactNode } from 'react'

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <SessionProvider refetchInterval={5 * 60}>
      <QueryProvider>
        <LayoutProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </LayoutProvider>
      </QueryProvider>
    </SessionProvider>
  )
}

export default Providers
