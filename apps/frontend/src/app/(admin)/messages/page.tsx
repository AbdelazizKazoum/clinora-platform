import PageBreadcrumb from '@/components/PageBreadcrumb'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Messages',
}

const Page = () => {
  return <PageBreadcrumb title="Messages" subtitle="Communication" />
}

export default Page
