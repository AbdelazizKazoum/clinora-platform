import PageBreadcrumb from '@/components/PageBreadcrumb'
import type { Metadata } from 'next'
import LayoutInfo from '../LayoutInfo'
import LayoutSwitcher from '../LayoutSwitcher'

export const metadata: Metadata = { title: 'On Hover Menu' }

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="On Hover Menu" subtitle="Layouts" />
      <LayoutSwitcher attribute="sidenavSize" value="on-hover" />
      <LayoutInfo option="sidenavSize" value="on-hover" />
    </>
  )
}

export default Page
