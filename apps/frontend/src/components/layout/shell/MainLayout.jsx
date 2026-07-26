'use client'

import { useLayoutContext } from '@/components/layout/context/useLayoutContext'
import { useAuth } from '@/hooks/useAuth'
import HorizontalLayout from '@/components/layout/shell/HorizontalLayout'
import VerticalLayout from '@/components/layout/shell/VerticalLayout'
const MainLayout = ({ children }) => {
  const { orientation } = useLayoutContext()
  const { isAuthenticated, isAuthReady } = useAuth()
  if (!isAuthReady || !isAuthenticated) {
    return null
  }
  return (
    <>
      {orientation === 'vertical' && <VerticalLayout>{children}</VerticalLayout>}
      {orientation === 'horizontal' && <HorizontalLayout>{children}</HorizontalLayout>}
    </>
  )
}
export default MainLayout
