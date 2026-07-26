import PageBreadcrumb from '@/components/PageBreadcrumb'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Staff',
}

const Page = () => {
  return <PageBreadcrumb title="Staff Members" subtitle="Staff" />
}

export default Page
