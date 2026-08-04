import { WaitingRoomPage } from '@/features/waiting-room';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Waiting Room',
};

const Page = () => {
  return <WaitingRoomPage />;
};

export default Page;
