import PageBreadcrumb from '@/components/PageBreadcrumb'
import type { Metadata } from 'next'
import LayoutInfo from '../LayoutInfo'
import LayoutSwitcher from '../LayoutSwitcher'

export const metadata: Metadata = { title: 'Gray Topbar' }

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Gray Topbar" subtitle="Layouts" />
      <LayoutSwitcher attribute="topbarColor" value="gray" />
      <LayoutInfo option="topbarColor" value="gray" />
    </>
  )
}

export default Page
