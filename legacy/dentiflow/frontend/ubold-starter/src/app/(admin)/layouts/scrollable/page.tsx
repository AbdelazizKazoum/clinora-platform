import PageBreadcrumb from '@/components/PageBreadcrumb'
import type { Metadata } from 'next'
import LayoutInfo from '../LayoutInfo'
import LayoutSwitcher from '../LayoutSwitcher'

export const metadata: Metadata = { title: 'Scrollable Layout' }

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Scrollable" subtitle="Layouts" />
      <LayoutSwitcher attribute="position" value="scrollable" />
      <LayoutInfo option="position" value="scrollable" />
      <div style={{ minHeight: '100vh' }}></div>
    </>
  )
}

export default Page
