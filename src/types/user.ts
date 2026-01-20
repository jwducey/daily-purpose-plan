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
  { name: 'Health', icon: 'heart', color: 'health', googleColorId: '2', weeklyHoursTarget: 7, description: 'Exercise, nutrition, wellness' },
  { name: 'Work', icon: 'briefcase', color: 'work', googleColorId: '7', weeklyHoursTarget: 40, description: 'Career and professional growth' },
  { name: 'Family', icon: 'users', color: 'family', googleColorId: '4', weeklyHoursTarget: 14, description: 'Quality time with loved ones' },
  { name: 'Community', icon: 'globe', color: 'community', googleColorId: '3', weeklyHoursTarget: 4, description: 'Friends and social connections' },
  { name: 'Wealth', icon: 'trending-up', color: 'wealth', googleColorId: '5', weeklyHoursTarget: 5, description: 'Financial planning and growth' },
  { name: 'Impact', icon: 'target', color: 'impact', googleColorId: '6', weeklyHoursTarget: 3, description: 'Making a difference' },
  { name: 'Legacy', icon: 'award', color: 'legacy', googleColorId: '1', weeklyHoursTarget: 2, description: 'Building lasting value' },
  { name: 'Contribution', icon: 'gift', color: 'contribution', googleColorId: '3', weeklyHoursTarget: 2, description: 'Giving back' },
  { name: 'Spiritual', icon: 'sun', color: 'spiritual', googleColorId: '1', weeklyHoursTarget: 5, description: 'Purpose and meaning' },
  { name: 'Emotional', icon: 'smile', color: 'emotional', googleColorId: '4', weeklyHoursTarget: 5, description: 'Mental health and growth' },
  { name: 'Play', icon: 'gamepad-2', color: 'play', googleColorId: '10', weeklyHoursTarget: 25, description: 'Fun and recreation' },
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
