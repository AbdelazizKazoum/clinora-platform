import { AppointmentSchedulePage } from '@/features/appointments'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Schedule',
}

const Page = () => {
  return <AppointmentSchedulePage />
}

export default Page
