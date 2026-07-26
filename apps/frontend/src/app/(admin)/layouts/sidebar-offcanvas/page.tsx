import PageBreadcrumb from '@/components/PageBreadcrumb'
import type { Metadata } from 'next'
import LayoutInfo from '../LayoutInfo'
import LayoutSwitcher from '../LayoutSwitcher'

export const metadata: Metadata = { title: 'Offcanvas Menu' }

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Offcanvas Menu" subtitle="Layouts" />
      <LayoutSwitcher attribute="sidenavSize" value="offcanvas" />
      <LayoutInfo option="sidenavSize" value="offcanvas" />
    </>
  )
}

export default Page
