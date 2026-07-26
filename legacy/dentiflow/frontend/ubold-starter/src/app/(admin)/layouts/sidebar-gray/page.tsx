import PageBreadcrumb from '@/components/PageBreadcrumb'
import type { Metadata } from 'next'
import LayoutInfo from '../LayoutInfo'
import LayoutSwitcher from '../LayoutSwitcher'

export const metadata: Metadata = { title: 'Gray Menu' }

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Gray Menu" subtitle="Layouts" />
      <LayoutSwitcher attribute="sidenavColor" value="gray" />
      <LayoutInfo option="sidenavColor" value="gray" />
    </>
  )
}

export default Page
