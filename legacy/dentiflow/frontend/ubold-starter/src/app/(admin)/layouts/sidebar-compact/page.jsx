import PageBreadcrumb from '@/components/PageBreadcrumb'
import LayoutInfo from '../LayoutInfo'
import LayoutSwitcher from '../LayoutSwitcher'
export const metadata = {
  title: 'Compact Menu',
}
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Compact Menu" subtitle="Layouts" />
      <LayoutSwitcher attribute="sidenavSize" value="compact" />
      <LayoutInfo option="sidenavSize" value="compact" />
    </>
  )
}
export default Page
