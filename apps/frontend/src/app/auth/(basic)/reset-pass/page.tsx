import { BasicResetPasswordPage } from '@/features/auth'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Reset Password' }

export default function Page() {
  return <BasicResetPasswordPage />
}
