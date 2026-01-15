import { useState, useEffect, useCallback } from 'react';
import { TimeRemaining, DayTimeRemaining } from '@/types/user';

export function useTimeRemaining(birthDate: Date, expectedLifespan: number) {
  const calculateTimeRemaining = useCallback((): TimeRemaining => {
    const now = new Date();
    const deathDate = new Date(birthDate);
    deathDate.setFullYear(deathDate.getFullYear() + expectedLifespan);
    
    const diffMs = deathDate.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return { seconds: 0, minutes: 0, hours: 0, days: 0, weeks: 0, months: 0, years: 0 };
    }
    
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30.44);
    const years = Math.floor(days / 365.25);
    
    return { seconds, minutes, hours, days, weeks, months, years };
  }, [birthDate, expectedLifespan]);

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(calculateTimeRemaining);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateTimeRemaining]);

  return timeRemaining;
}

export function useDayTimeRemaining() {
  const calculateDayTimeRemaining = useCallback((): DayTimeRemaining => {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    
    const diffMs = endOfDay.getTime() - now.getTime();
    
    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return { seconds: totalSeconds, minutes: Math.floor(totalSeconds / 60), hours };
  }, []);

  const [dayTimeRemaining, setDayTimeRemaining] = useState<DayTimeRemaining>(calculateDayTimeRemaining);

  useEffect(() => {
    const interval = setInterval(() => {
      setDayTimeRemaining(calculateDayTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateDayTimeRemaining]);

  return dayTimeRemaining;
}
