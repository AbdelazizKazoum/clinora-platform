import { BasicLoginPinPage } from '@/features/auth'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Login with Pin' }

export default function Page() {
  return <BasicLoginPinPage />
}
