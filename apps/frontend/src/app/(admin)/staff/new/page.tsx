import { CreateStaffPage } from '@/features/staff'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Add Staff Member',
}

const Page = () => {
  return <CreateStaffPage />
}

export default Page
