import PageBreadcrumb from '@/components/PageBreadcrumb'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Add Patient',
}

const Page = () => {
  return <PageBreadcrumb title="Add Patient" subtitle="Patients" />
}

export default Page
