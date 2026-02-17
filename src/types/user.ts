export interface UserProfile {
  id: string;
  name: string;
  email: string;
  age: number;
  expectedLifespan: number;
  birthDate: Date;
  role: 'user' | 'admin';
  createdAt: Date;
  lastLogin: Date;
  selfieUrl?: string;
  agedSelfieUrl?: string;
  onboardingComplete: boolean;
}

export interface TimeBudgetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  googleColorId: string; // Google Calendar color ID (1-11)
  weeklyHoursTarget: number;
  weeklyHoursActual: number;
  description: string;
}

// Google Calendar color options with their display names and hex values
export const GOOGLE_CALENDAR_COLORS: Record<string, { name: string; hex: string }> = {
  '1': { name: 'Lavender', hex: '#7986cb' },
  '2': { name: 'Sage', hex: '#33b679' },
  '3': { name: 'Grape', hex: '#8e24aa' },
  '4': { name: 'Flamingo', hex: '#e67c73' },
  '5': { name: 'Banana', hex: '#f6bf26' },
  '6': { name: 'Tangerine', hex: '#f4511e' },
  '7': { name: 'Peacock', hex: '#039be5' },
  '8': { name: 'Graphite', hex: '#616161' },
  '9': { name: 'Blueberry', hex: '#3f51b5' },
  '10': { name: 'Basil', hex: '#0b8043' },
  '11': { name: 'Tomato', hex: '#d50000' },
};

export const DEFAULT_CATEGORIES: Omit<TimeBudgetCategory, 'id' | 'weeklyHoursActual'>[] = [
  { name: 'Sleep', icon: 'moon', color: 'sleep', googleColorId: '9', weeklyHoursTarget: 56, description: 'Rest and recovery' },
  { name: 'Financial', icon: 'trending-up', color: 'financial', googleColorId: '5', weeklyHoursTarget: 5, description: 'Financial planning, investing, and wealth building' },
  { name: 'Business and Career', icon: 'briefcase', color: 'business', googleColorId: '7', weeklyHoursTarget: 40, description: 'Professional growth and career development' },
  { name: 'Relationships', icon: 'users', color: 'relationships', googleColorId: '4', weeklyHoursTarget: 14, description: 'Family, friends, and meaningful connections' },
  { name: 'Health and Fitness', icon: 'heart', color: 'health', googleColorId: '2', weeklyHoursTarget: 10, description: 'Exercise, nutrition, and wellness' },
  { name: 'Fun and Recreation', icon: 'gamepad-2', color: 'fun', googleColorId: '10', weeklyHoursTarget: 20, description: 'Hobbies, play, and leisure activities' },
  { name: 'Personal Growth', icon: 'book-open', color: 'growth', googleColorId: '3', weeklyHoursTarget: 7, description: 'Learning, spirituality, and self-improvement' },
  { name: 'Community Contribution', icon: 'globe', color: 'community', googleColorId: '6', weeklyHoursTarget: 4, description: 'Giving back and making a difference' },
];

export interface TimeRemaining {
  seconds: number;
  minutes: number;
  hours: number;
  days: number;
  weeks: number;
  months: number;
  years: number;
}

export interface DayTimeRemaining {
  seconds: number;
  minutes: number;
  hours: number;
}
