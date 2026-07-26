import PageBreadcrumb from '@/components/PageBreadcrumb'
import type { Metadata } from 'next'
import { Container } from 'react-bootstrap'
import LayoutInfo from '../LayoutInfo'
import LayoutSwitcher from '../LayoutSwitcher'

export const metadata: Metadata = { title: 'Compact Layout' }

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Compact" subtitle="Layouts" />
      <LayoutSwitcher attribute="width" value="compact" />
      <Container fluid="xl">
        <LayoutInfo option="width" value="compact" />
      </Container>
    </>
  )
}

export default Page
