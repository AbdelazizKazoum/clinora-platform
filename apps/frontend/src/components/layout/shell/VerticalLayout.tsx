import Customizer from '@/components/layout/shell/components/Customizer'
import Footer from '@/components/layout/shell/components/Footer'
import Sidenav from '@/components/layout/shell/components/Sidenav'
import TopBar from '@/components/layout/shell/components/TopBar'
import type { MenuItemType } from '@/types'
import { type ReactNode } from 'react'
import { Container } from 'react-bootstrap'

interface VerticalLayoutProps {
  children: ReactNode
  isLoggingOut: boolean
  menuItems: MenuItemType[]
  onLogout: () => Promise<void>
}

const VerticalLayout = ({ children, isLoggingOut, menuItems, onLogout }: VerticalLayoutProps) => {
  return (
    <>
      <div className="wrapper">
        <Sidenav menuItems={menuItems} />
        <TopBar isLoggingOut={isLoggingOut} onLogout={onLogout} />
        <div className="content-page">
          <Container fluid>{children}</Container>
          <Footer />
        </div>
      </div>
      <Customizer />
    </>
  )
}

export default VerticalLayout
