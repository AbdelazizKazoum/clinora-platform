'use client'

import { useLayoutContext } from '@/context/useLayoutContext'
import { useAuth } from '@/hooks/useAuth'
import HorizontalLayout from '@/layouts/HorizontalLayout'
import VerticalLayout from '@/layouts/VerticalLayout'
const MainLayout = ({ children }) => {
  const { orientation } = useLayoutContext()
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
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
