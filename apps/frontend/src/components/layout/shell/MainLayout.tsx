'use client'
import { useLayoutContext } from '@/components/layout/context/useLayoutContext'
import HorizontalLayout from '@/components/layout/shell/HorizontalLayout'
import VerticalLayout from '@/components/layout/shell/VerticalLayout'

interface MainLayoutProps {
  children: React.ReactNode
  isLoggingOut: boolean
  onLogout: () => Promise<void>
}

const MainLayout = ({ children, isLoggingOut, onLogout }: MainLayoutProps) => {
  const { orientation } = useLayoutContext()

  return (
    <>
      {orientation === 'vertical' && (
        <VerticalLayout isLoggingOut={isLoggingOut} onLogout={onLogout}>
          {children}
        </VerticalLayout>
      )}
      {orientation === 'horizontal' && (
        <HorizontalLayout isLoggingOut={isLoggingOut} onLogout={onLogout}>
          {children}
        </HorizontalLayout>
      )}
    </>
  )
}

export default MainLayout
