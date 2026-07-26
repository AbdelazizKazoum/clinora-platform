import PageBreadcrumb from '@/components/PageBreadcrumb'
import type { Metadata } from 'next'
import LayoutInfo from '../LayoutInfo'
import LayoutSwitcher from '../LayoutSwitcher'

export const metadata: Metadata = { title: 'Light Topbar' }

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Light Topbar" subtitle="Layouts" />
      <LayoutSwitcher attribute="topbarColor" value="light" />
      <LayoutInfo option="topbarColor" value="light" />
    </>
  )
}

export default Page
