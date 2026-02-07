import { Navigation } from '@/components/Navigation';
import { HabitTracker } from '@/components/HabitTracker';

export default function Habits() {
  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <Navigation />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <HabitTracker />
        </div>
      </main>
    </div>
  );
}
