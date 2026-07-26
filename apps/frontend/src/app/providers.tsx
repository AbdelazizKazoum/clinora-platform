'use client'
import { LayoutProvider } from '@/components/layout/context/useLayoutContext'
import { NotificationProvider } from '@/components/layout/context/useNotificationContext'
import type { ReactNode } from 'react'

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <LayoutProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </LayoutProvider>
  )
}

export default Providers
