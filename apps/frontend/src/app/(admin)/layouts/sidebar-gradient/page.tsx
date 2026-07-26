import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Metadata } from 'next'
import LayoutInfo from '../LayoutInfo'
import LayoutSwitcher from '../LayoutSwitcher'

export const metadata: Metadata = { title: 'Gradient Menu' }

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Gradient Menu" subtitle="Layouts" />
      <LayoutSwitcher attribute="sidenavColor" value="gradient" />
      <LayoutInfo option="sidenavColor" value="gradient" />
    </>
  )
}

export default Page
