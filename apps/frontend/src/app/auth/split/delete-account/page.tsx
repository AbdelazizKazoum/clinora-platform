import { SplitDeleteAccountPage } from '@/features/auth'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Delete Account' }

export default function Page() {
  return <SplitDeleteAccountPage />
}
