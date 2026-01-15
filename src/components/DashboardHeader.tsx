import { useUser } from '@/contexts/UserContext';
import { motion } from 'framer-motion';

export function DashboardHeader() {
  const { user } = useUser();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getMotivationalMessage = () => {
    const messages = [
      'Every second is a choice.',
      'Time is your most precious currency.',
      'Invest wisely in what matters.',
      'Your future self will thank you.',
      'Small moments compound into a life.',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <motion.header 
      className="space-y-1"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-2xl md:text-3xl font-serif">
        {getGreeting()}, <span className="text-life-energy">{user?.name}</span>
      </h1>
      <p className="text-muted-foreground text-sm">
        {getMotivationalMessage()}
      </p>
    </motion.header>
  );
}
