import { Navigation } from '@/components/Navigation';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { User, Clock, Trash2, LogIn, LogOut, Gem, ClipboardCheck } from 'lucide-react';
import { GoogleCalendarSettings } from '@/components/GoogleCalendarSettings';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { user: localUser, setUser, capitalTabEnabled, setCapitalTabEnabled, dailyReviewTime, setDailyReviewTime } = useUser();
  const { user: authUser, signOut } = useAuth();
  const { toast } = useToast();

  if (!localUser) return null;

  const handleReset = () => {
    if (confirm('Are you sure? This will reset all your data.')) {
      localStorage.clear();
      setUser(null);
      window.location.reload();
    }
  };

  const updateUser = (updates: Partial<typeof localUser>) => {
    setUser({ ...localUser, ...updates });
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been signed out successfully.',
    });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <Navigation />
      
      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-2xl mx-auto p-6 md:p-10 space-y-8">
          <motion.header 
            className="space-y-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl md:text-3xl font-serif">Settings</h1>
            <p className="text-muted-foreground text-sm">
              Manage your profile and preferences.
            </p>
          </motion.header>

          {/* Account section */}
          <motion.div 
            className="p-6 rounded-2xl bg-card shadow-card space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <LogIn className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-serif text-lg">Account</h2>
            </div>

            {authUser ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{authUser.email}</p>
                    <p className="text-sm text-muted-foreground">Signed in</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Sign in to sync your data and connect integrations like Google Calendar.
                </p>
                <Button asChild size="sm">
                  <Link to="/auth">
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign in
                  </Link>
                </Button>
              </div>
            )}
          </motion.div>

          {/* Profile section */}
          <motion.div 
            className="p-6 rounded-2xl bg-card shadow-card space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-life-energy/10">
                <User className="w-5 h-5 text-life-energy" />
              </div>
              <h2 className="font-serif text-lg">Profile</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={localUser.name}
                  onChange={(e) => updateUser({ name: e.target.value })}
                />
              </div>
            </div>
          </motion.div>

          {/* Life expectancy section */}
          <motion.div 
            className="p-6 rounded-2xl bg-card shadow-card space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              <h2 className="font-serif text-lg">Life Expectancy</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Expected lifespan</Label>
                  <span className="font-sans font-semibold">{localUser.expectedLifespan} years</span>
                </div>
                <Slider
                  value={[localUser.expectedLifespan]}
                  min={localUser.age + 1}
                  max={120}
                  step={1}
                  onValueChange={(values) => updateUser({ expectedLifespan: values[0] })}
                />
              </div>
              
              <p className="text-sm text-muted-foreground">
                With {localUser.expectedLifespan - localUser.age} years remaining, make every moment count.
              </p>
            </div>
          </motion.div>

          {/* Google Calendar section */}
          <GoogleCalendarSettings />

          {/* Daily Review Time */}
          <motion.div 
            className="p-6 rounded-2xl bg-card shadow-card space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-life-energy/10">
                <ClipboardCheck className="w-5 h-5 text-life-energy" />
              </div>
              <h2 className="font-serif text-lg">Daily Review</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable daily review reminder</p>
                  <p className="text-sm text-muted-foreground">
                    A full-screen review will appear at the set time until completed.
                  </p>
                </div>
                <Switch
                  checked={!!dailyReviewTime}
                  onCheckedChange={(checked) => setDailyReviewTime(checked ? '21:00' : null)}
                />
              </div>
              {dailyReviewTime && (
                <div className="space-y-2">
                  <Label htmlFor="review-time">Review time</Label>
                  <Input
                    id="review-time"
                    type="time"
                    value={dailyReviewTime}
                    onChange={(e) => setDailyReviewTime(e.target.value)}
                    className="w-40"
                  />
                </div>
              )}
            </div>
          </motion.div>

          {/* Capital tab toggle */}
          <motion.div 
            className="p-6 rounded-2xl bg-card shadow-card space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Gem className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-serif text-lg">Capital Tracking</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Capital tab</p>
                <p className="text-sm text-muted-foreground">Track your eight forms of capital.</p>
              </div>
              <Switch
                checked={capitalTabEnabled}
                onCheckedChange={setCapitalTabEnabled}
              />
            </div>
          </motion.div>

          {/* Danger zone */}
          <motion.div 
            className="p-6 rounded-2xl border border-destructive/20 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="font-serif text-lg text-destructive">Danger Zone</h2>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Reset all data</p>
                <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
              </div>
              <Button variant="destructive" size="sm" onClick={handleReset}>
                <Trash2 className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
