import { notFound } from 'next/navigation';
import { OdontogramReferencePage } from '@/features/treatment';

export default function Page() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <OdontogramReferencePage />;
}
