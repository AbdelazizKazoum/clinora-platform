import Customizer from '@/components/layout/shell/components/Customizer'
import Footer from '@/components/layout/shell/components/Footer'
import Sidenav from '@/components/layout/shell/components/Sidenav'
import TopBar from '@/components/layout/shell/components/TopBar'
import { type ReactNode } from 'react'
import { Container } from 'react-bootstrap'

const VerticalLayout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <div className="wrapper">
        <Sidenav />
        <TopBar />
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
