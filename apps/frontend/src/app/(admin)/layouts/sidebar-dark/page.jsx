import PageBreadcrumb from '@/components/PageBreadcrumb'
import LayoutInfo from '../LayoutInfo'
import LayoutSwitcher from '../LayoutSwitcher'
export const metadata = {
  title: 'Dark Menu',
}
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Dark Menu" subtitle="Layouts" />
      <LayoutSwitcher attribute="sidenavColor" value="dark" />
      <LayoutInfo option="sidenavColor" value="dark" />
    </>
  )
}
export default Page
