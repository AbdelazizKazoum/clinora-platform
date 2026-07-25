import PageBreadcrumb from '@/components/PageBreadcrumb'
import LayoutInfo from '../LayoutInfo'
import LayoutSwitcher from '../LayoutSwitcher'
export const metadata = {
  title: 'Gray Topbar',
}
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
