import PageBreadcrumb from '@/components/PageBreadcrumb'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Visits',
}

const Page = () => {
  return <PageBreadcrumb title="All Visits" subtitle="Visits" />
}

export default Page
