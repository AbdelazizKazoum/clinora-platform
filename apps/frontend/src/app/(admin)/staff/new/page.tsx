import PageBreadcrumb from '@/components/PageBreadcrumb'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Add Staff Member',
}

const Page = () => {
  return <PageBreadcrumb title="Add Staff Member" subtitle="Staff" />
}

export default Page
