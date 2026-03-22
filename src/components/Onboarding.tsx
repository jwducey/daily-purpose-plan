import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Clock, Target, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function Onboarding() {
  const { completeOnboarding } = useUser();
  const [step, setStep] = useState(0);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: 30,
    expectedLifespan: 80,
  });

  const steps = [
    {
      title: 'Welcome to LifeWealth',
      subtitle: 'Your most finite resource is time. Let\'s make every moment count.',
      icon: Clock,
    },
    {
      title: 'What should we call you?',
      subtitle: 'We\'ll personalize your experience.',
      icon: Sparkles,
    },
    {
      title: 'How old are you?',
      subtitle: 'This helps us calculate your life remaining.',
      icon: Target,
    },
    {
      title: 'Expected lifespan',
      subtitle: 'Be realistic. Average is around 78-82 years.',
      icon: Target,
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      // Calculate birth date from age
      const today = new Date();
      const birthYear = today.getFullYear() - formData.age;
      const birthDate = new Date(birthYear, today.getMonth(), today.getDate());
      
      completeOnboarding({
        name: formData.name,
        age: formData.age,
        expectedLifespan: formData.expectedLifespan,
        birthDate,
      });
    }
  };

  const canProceed = () => {
    if (step === 1) return formData.name.trim().length > 0;
    return true;
  };

  const StepIcon = steps[step].icon;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-background to-muted/30">
      <motion.div 
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-12">
          {steps.map((_, index) => (
            <motion.div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === step 
                  ? 'w-8 bg-life-energy' 
                  : index < step 
                    ? 'w-1.5 bg-life-energy/50' 
                    : 'w-1.5 bg-muted-foreground/20'
              }`}
              layoutId={`dot-${index}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Icon */}
            <div className="flex justify-center">
              <div className="p-4 rounded-2xl bg-life-energy/10">
                <StepIcon className="w-8 h-8 text-life-energy" />
              </div>
            </div>

            {/* Content */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl md:text-4xl font-serif">
                {steps[step].title}
              </h1>
              <p className="text-muted-foreground">
                {steps[step].subtitle}
              </p>
            </div>

            {/* Step-specific content */}
            <div className="pt-4">
              {step === 0 && (
                <div className="space-y-6 text-center">
                  <p className="text-muted-foreground leading-relaxed">
                    Money can be earned back. Time cannot. LifeWealth helps you invest 
                    your life energy in what truly matters to you.
                  </p>
                  <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-life-energy" />
                      Budget your time
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-growth" />
                      Track alignment
                    </span>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <Label htmlFor="name" className="sr-only">Your name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="text-center text-lg h-14"
                    autoFocus
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <span className="text-6xl font-serif text-life-energy">
                      {formData.age}
                    </span>
                    <span className="text-2xl text-muted-foreground ml-2">years old</span>
                  </div>
                  <Slider
                    value={[formData.age]}
                    min={18}
                    max={100}
                    step={1}
                    onValueChange={(values) => setFormData({ ...formData, age: values[0] })}
                    className="pt-4"
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <span className="text-6xl font-serif text-life-energy">
                      {formData.expectedLifespan}
                    </span>
                    <span className="text-2xl text-muted-foreground ml-2">years</span>
                  </div>
                  <Slider
                    value={[formData.expectedLifespan]}
                    min={formData.age + 1}
                    max={120}
                    step={1}
                    onValueChange={(values) => setFormData({ ...formData, expectedLifespan: values[0] })}
                    className="pt-4"
                  />
                  <p className="text-center text-sm text-muted-foreground">
                    That's <span className="font-semibold text-foreground">
                      {formData.expectedLifespan - formData.age} years
                    </span> of life remaining
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <motion.div 
          className="mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="w-full h-14 text-lg font-medium gap-2"
            size="lg"
          >
            {step === steps.length - 1 ? 'Start My Journey' : 'Continue'}
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
