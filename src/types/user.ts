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
  weeklyHoursTarget: number;
  weeklyHoursActual: number;
  description: string;
}

export const DEFAULT_CATEGORIES: Omit<TimeBudgetCategory, 'id' | 'weeklyHoursActual'>[] = [
  { name: 'Sleep', icon: 'moon', color: 'sleep', weeklyHoursTarget: 56, description: 'Rest and recovery' },
  { name: 'Health', icon: 'heart', color: 'health', weeklyHoursTarget: 7, description: 'Exercise, nutrition, wellness' },
  { name: 'Work', icon: 'briefcase', color: 'work', weeklyHoursTarget: 40, description: 'Career and professional growth' },
  { name: 'Family', icon: 'users', color: 'family', weeklyHoursTarget: 14, description: 'Quality time with loved ones' },
  { name: 'Community', icon: 'globe', color: 'community', weeklyHoursTarget: 4, description: 'Friends and social connections' },
  { name: 'Wealth', icon: 'trending-up', color: 'wealth', weeklyHoursTarget: 5, description: 'Financial planning and growth' },
  { name: 'Impact', icon: 'target', color: 'impact', weeklyHoursTarget: 3, description: 'Making a difference' },
  { name: 'Legacy', icon: 'award', color: 'legacy', weeklyHoursTarget: 2, description: 'Building lasting value' },
  { name: 'Contribution', icon: 'gift', color: 'contribution', weeklyHoursTarget: 2, description: 'Giving back' },
  { name: 'Spiritual', icon: 'sun', color: 'spiritual', weeklyHoursTarget: 5, description: 'Purpose and meaning' },
  { name: 'Emotional', icon: 'smile', color: 'emotional', weeklyHoursTarget: 5, description: 'Mental health and growth' },
  { name: 'Play', icon: 'gamepad-2', color: 'play', weeklyHoursTarget: 25, description: 'Fun and recreation' },
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
