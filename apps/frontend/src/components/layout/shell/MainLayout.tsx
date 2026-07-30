'use client'
import { useLayoutContext } from '@/components/layout/context/useLayoutContext'
import HorizontalLayout from '@/components/layout/shell/HorizontalLayout'
import VerticalLayout from '@/components/layout/shell/VerticalLayout'
import type { MenuItemType } from '@/types'

interface MainLayoutProps {
  children: React.ReactNode
  isLoggingOut: boolean
  menuItems: MenuItemType[]
  onLogout: () => Promise<void>
}

const MainLayout = ({ children, isLoggingOut, menuItems, onLogout }: MainLayoutProps) => {
  const { orientation } = useLayoutContext()

  return (
    <>
      {orientation === 'vertical' && (
        <VerticalLayout isLoggingOut={isLoggingOut} menuItems={menuItems} onLogout={onLogout}>
          {children}
        </VerticalLayout>
      )}
      {orientation === 'horizontal' && (
        <HorizontalLayout isLoggingOut={isLoggingOut} menuItems={menuItems} onLogout={onLogout}>
          {children}
        </HorizontalLayout>
      )}
    </>
  )
}

export default MainLayout
