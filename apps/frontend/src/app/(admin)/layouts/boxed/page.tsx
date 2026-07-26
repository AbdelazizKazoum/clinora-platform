import PageBreadcrumb from '@/components/PageBreadcrumb'
import type { Metadata } from 'next'
import LayoutInfo from '../LayoutInfo'
import LayoutSwitcher from '../LayoutSwitcher'

export const metadata: Metadata = { title: 'Boxed Layout' }

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Boxed" subtitle="Layouts" />
      <LayoutSwitcher attribute="width" value="boxed" />
      <LayoutInfo option="width" value="boxed" />
    </>
  )
}

export default Page
