import PageBreadcrumb from '@/components/PageBreadcrumb'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Schedule',
}

const Page = () => {
  return <PageBreadcrumb title="Schedule" subtitle="Clinical" />
}

export default Page
