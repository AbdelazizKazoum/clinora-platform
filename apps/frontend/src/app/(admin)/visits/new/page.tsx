import PageBreadcrumb from '@/components/PageBreadcrumb'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'New Visit',
}

const Page = () => {
  return <PageBreadcrumb title="New Visit" subtitle="Visits" />
}

export default Page
