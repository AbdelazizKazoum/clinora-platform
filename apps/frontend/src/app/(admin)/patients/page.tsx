import PageBreadcrumb from '@/components/PageBreadcrumb'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Patients',
}

const Page = () => {
  return <PageBreadcrumb title="All Patients" subtitle="Patients" />
}

export default Page
