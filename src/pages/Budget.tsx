import { Navigation } from '@/components/Navigation';
import { TimeBudgetAllocation } from '@/components/TimeBudgetAllocation';
import { motion } from 'framer-motion';

export default function Budget() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <Navigation />
      
      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-3xl mx-auto p-6 md:p-10 space-y-8">
          <motion.header 
            className="space-y-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl md:text-3xl font-serif">Time Budget</h1>
            <p className="text-muted-foreground text-sm">
              Allocate your 168 weekly hours across life areas that matter to you.
            </p>
          </motion.header>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <TimeBudgetAllocation />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
