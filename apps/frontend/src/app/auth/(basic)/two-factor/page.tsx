import { BasicTwoFactorPage } from '@/features/auth'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Two Factor Authentication' }

export default function Page() {
  return <BasicTwoFactorPage />
}
