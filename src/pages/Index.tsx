import { useUser } from '@/contexts/UserContext';
import { Onboarding } from '@/components/Onboarding';
import Dashboard from './Dashboard';

const Index = () => {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">
          <div className="w-12 h-12 rounded-xl bg-life-energy/20" />
        </div>
      </div>
    );
  }

  if (!user || !user.onboardingComplete) {
    return <Onboarding />;
  }

  return <Dashboard />;
};

export default Index;
