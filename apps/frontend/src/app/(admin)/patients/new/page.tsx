import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Add/Edit Patient',
};

const Page = () => redirect('/patients');

export default Page;
