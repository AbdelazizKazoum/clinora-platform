import { SplitSignUpPage } from '@/features/auth'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Create New Account' }

export default function Page() {
  return <SplitSignUpPage />
}
