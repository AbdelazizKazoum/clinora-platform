import { TreatmentWorkspacePage } from '@/features/treatment';
import type { TreatmentLaunchContext } from '@/features/treatment';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Visit',
};

interface NewVisitPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const readSingle = (value: string | string[] | undefined): string | null => {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate?.trim() || null;
};

const Page = async ({ searchParams }: NewVisitPageProps) => {
  const params = await searchParams;
  const patientId = readSingle(params.patientId);
  const doctorId = readSingle(params.doctorId);
  const launchContext: TreatmentLaunchContext | null =
    patientId && doctorId
      ? {
          appointmentId: readSingle(params.appointmentId),
          chairId: readSingle(params.chairId),
          doctorId,
          patientId,
          queueEntryId: readSingle(params.queueEntryId),
        }
      : null;

  return <TreatmentWorkspacePage launchContext={launchContext} />;
};

export default Page;
