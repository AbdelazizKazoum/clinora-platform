import { PatientsPage } from '@/features/patients';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Patients',
};

const Page = () => {
  return <PatientsPage />;
};

export default Page;
