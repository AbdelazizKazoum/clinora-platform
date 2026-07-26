import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Starter Page' }

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Starter" subtitle="Pages" />
    </>
  )
}

export default Page
