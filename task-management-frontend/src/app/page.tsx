import TaskSection from '@/components/tasks/TaskSection';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bảng điều khiển',
};

export default function HomePage() {
  return <TaskSection />;
}
