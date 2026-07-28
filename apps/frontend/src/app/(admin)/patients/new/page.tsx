import { PatientNewPage } from '@/features/patients';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Add Patient',
};

const Page = () => <PatientNewPage />;

export default Page;
