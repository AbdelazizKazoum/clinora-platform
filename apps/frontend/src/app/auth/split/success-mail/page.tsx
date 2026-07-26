import { SplitSuccessMailPage } from '@/features/auth'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Success Mail' }

export default function Page() {
  return <SplitSuccessMailPage />
}
