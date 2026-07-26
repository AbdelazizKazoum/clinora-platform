'use client'
import { useLayoutContext } from '@/components/layout/context/useLayoutContext'
import HorizontalLayout from '@/components/layout/shell/HorizontalLayout'
import VerticalLayout from '@/components/layout/shell/VerticalLayout'

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { orientation } = useLayoutContext()

  return (
    <>
      {orientation === 'vertical' && <VerticalLayout>{children}</VerticalLayout>}
      {orientation === 'horizontal' && <HorizontalLayout>{children}</HorizontalLayout>}
    </>
  )
}

export default MainLayout
