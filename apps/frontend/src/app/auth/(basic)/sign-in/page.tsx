import { BasicSignInPage } from '@/features/auth'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Sign In' }

export default function Page() {
  return <BasicSignInPage />
}
