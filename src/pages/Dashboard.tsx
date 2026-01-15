import { useUser } from '@/contexts/UserContext';
import { MortalityCountdown } from '@/components/MortalityCountdown';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Navigation } from '@/components/Navigation';
import { motion } from 'framer-motion';
import { PieChart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, categories } = useUser();

  if (!user) return null;

  const totalAllocated = categories.reduce((sum, cat) => sum + cat.weeklyHoursTarget, 0);
  const topCategories = [...categories]
    .sort((a, b) => b.weeklyHoursTarget - a.weeklyHoursTarget)
    .slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <Navigation />
      
      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-10">
          <DashboardHeader />
          
          {/* Mortality Countdown - Hero section */}
          <motion.section 
            className="p-8 md:p-12 rounded-3xl bg-card shadow-soft"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <MortalityCountdown 
              birthDate={user.birthDate} 
              expectedLifespan={user.expectedLifespan} 
            />
          </motion.section>

          {/* Quick stats */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Time budget overview */}
            <motion.div 
              className="p-6 rounded-2xl bg-card shadow-card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-life-energy/10">
                    <PieChart className="w-5 h-5 text-life-energy" />
                  </div>
                  <h3 className="font-serif text-lg">Weekly Budget</h3>
                </div>
                <Link 
                  to="/budget" 
                  className="text-sm text-muted-foreground hover:text-life-energy transition-colors flex items-center gap-1"
                >
                  Edit <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="space-y-3">
                {topCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{cat.name}</span>
                    <span className="font-sans font-medium">{cat.weeklyHoursTarget}h</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-sm font-medium">Total Allocated</span>
                <span className="font-sans font-semibold text-life-energy">
                  {totalAllocated}/168h
                </span>
              </div>
            </motion.div>

            {/* Weekly insight */}
            <motion.div 
              className="p-6 rounded-2xl bg-gradient-to-br from-life-energy/10 to-life-energy/5 border border-life-energy/10"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <h3 className="font-serif text-lg mb-3">Weekly Insight</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                You've allocated <span className="font-medium text-foreground">{topCategories[0]?.name}</span> as 
                your biggest time investment this week. Is this aligned with your long-term goals?
              </p>
              <Link 
                to="/review" 
                className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-life-energy hover:underline"
              >
                Start Weekly Review <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
