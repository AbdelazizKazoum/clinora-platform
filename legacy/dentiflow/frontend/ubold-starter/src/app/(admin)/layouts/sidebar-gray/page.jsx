import PageBreadcrumb from '@/components/PageBreadcrumb'
import LayoutInfo from '../LayoutInfo'
import LayoutSwitcher from '../LayoutSwitcher'
export const metadata = {
  title: 'Gray Menu',
}
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
