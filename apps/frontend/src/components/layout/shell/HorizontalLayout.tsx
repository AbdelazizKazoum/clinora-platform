'use client'
import Customizer from '@/components/layout/shell/components/Customizer'
import Footer from '@/components/layout/shell/components/Footer'
import TopBar from '@/components/layout/shell/components/TopBar'
import { type ReactNode } from 'react'
import { Container } from 'react-bootstrap'
import ResponsiveNav from './components/ResponsiveNav'

const HorizontalLayout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <div className="wrapper">
        <TopBar />
        <ResponsiveNav />
        <div className="content-page">
          <Container fluid>{children}</Container>
          <Footer />
        </div>
      </div>
      <Customizer />
    </>
  )
}

export default HorizontalLayout
