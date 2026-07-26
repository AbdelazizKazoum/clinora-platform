import PageBreadcrumb from '@/components/PageBreadcrumb'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Waiting Room',
}

const Page = () => {
  return <PageBreadcrumb title="Waiting Room" subtitle="Clinical" />
}

export default Page
