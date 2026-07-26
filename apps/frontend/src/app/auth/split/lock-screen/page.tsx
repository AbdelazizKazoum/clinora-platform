import { SplitLockScreenPage } from '@/features/auth'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Lock Screen' }

export default function Page() {
  return <SplitLockScreenPage />
}
