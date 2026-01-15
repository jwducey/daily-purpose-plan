import { Navigation } from '@/components/Navigation';
import { useUser } from '@/contexts/UserContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';

const reviewQuestions = [
  {
    id: 1,
    question: 'What went well this week in terms of how you spent your time?',
    placeholder: 'I was proud of how I prioritized...',
  },
  {
    id: 2,
    question: 'Where did you spend more time than you intended?',
    placeholder: 'I noticed I spent extra time on...',
  },
  {
    id: 3,
    question: 'What areas felt neglected that are important to you?',
    placeholder: 'I wish I had more time for...',
  },
  {
    id: 4,
    question: 'What one adjustment will you make next week?',
    placeholder: 'Next week, I will...',
  },
];

export default function Review() {
  const { categories } = useUser();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isComplete, setIsComplete] = useState(false);

  const handleNext = () => {
    if (currentQuestion < reviewQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setIsComplete(true);
    }
  };

  const topCategories = [...categories]
    .sort((a, b) => b.weeklyHoursTarget - a.weeklyHoursTarget)
    .slice(0, 5);

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
            <h1 className="text-2xl md:text-3xl font-serif">Weekly Review</h1>
            <p className="text-muted-foreground text-sm">
              Reflect on your time allocation and plan for improvement.
            </p>
          </motion.header>

          {/* Time summary */}
          <motion.div 
            className="p-6 rounded-2xl bg-card shadow-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="font-serif text-lg mb-4">Your Time Allocation</h3>
            <div className="space-y-3">
              {topCategories.map((cat, index) => (
                <div key={cat.id} className="flex items-center gap-4">
                  <span className="w-6 text-sm text-muted-foreground">#{index + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{cat.name}</span>
                      <span className="text-sm text-muted-foreground">{cat.weeklyHoursTarget}h</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-category-${cat.color}`}
                        style={{ width: `${(cat.weeklyHoursTarget / 168) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Review questions */}
          {!isComplete ? (
            <motion.div 
              className="p-6 rounded-2xl bg-card shadow-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-4">
                {reviewQuestions.map((_, index) => (
                  <div 
                    key={index}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      index <= currentQuestion ? 'bg-life-energy' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              
              <h3 className="font-serif text-xl mb-4">
                {reviewQuestions[currentQuestion].question}
              </h3>
              
              <Textarea
                placeholder={reviewQuestions[currentQuestion].placeholder}
                value={answers[reviewQuestions[currentQuestion].id] || ''}
                onChange={(e) => setAnswers({
                  ...answers,
                  [reviewQuestions[currentQuestion].id]: e.target.value
                })}
                className="min-h-[120px] resize-none"
              />
              
              <div className="flex justify-end mt-4">
                <Button onClick={handleNext} className="gap-2">
                  {currentQuestion < reviewQuestions.length - 1 ? 'Next' : 'Complete Review'}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              className="p-8 rounded-2xl bg-growth/10 border border-growth/20 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <CheckCircle2 className="w-12 h-12 text-growth mx-auto mb-4" />
              <h3 className="font-serif text-2xl mb-2">Review Complete!</h3>
              <p className="text-muted-foreground">
                Great job reflecting on your week. Small adjustments lead to big changes over time.
              </p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
