import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, TimeBudgetCategory, DEFAULT_CATEGORIES } from '@/types/user';

interface UserContextType {
  user: UserProfile | null;
  categories: TimeBudgetCategory[];
  setUser: (user: UserProfile | null) => void;
  updateCategory: (categoryId: string, updates: Partial<TimeBudgetCategory>) => void;
  completeOnboarding: (userData: Partial<UserProfile>) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [categories, setCategories] = useState<TimeBudgetCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on mount
    const savedUser = localStorage.getItem('lifewealth_user');
    const savedCategories = localStorage.getItem('lifewealth_categories');
    
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser({
        ...parsed,
        birthDate: new Date(parsed.birthDate),
        createdAt: new Date(parsed.createdAt),
        lastLogin: new Date(parsed.lastLogin),
      });
    }
    
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    } else {
      // Initialize with default categories
      const initialCategories = DEFAULT_CATEGORIES.map((cat, index) => ({
        ...cat,
        id: `cat_${index}`,
        weeklyHoursActual: 0,
      }));
      setCategories(initialCategories);
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('lifewealth_user', JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem('lifewealth_categories', JSON.stringify(categories));
    }
  }, [categories]);

  const completeOnboarding = (userData: Partial<UserProfile>) => {
    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      name: userData.name || 'User',
      email: userData.email || '',
      age: userData.age || 30,
      expectedLifespan: userData.expectedLifespan || 80,
      birthDate: userData.birthDate || new Date(new Date().getFullYear() - 30, 0, 1),
      role: 'user',
      createdAt: new Date(),
      lastLogin: new Date(),
      onboardingComplete: true,
    };
    setUser(newUser);
  };

  const updateCategory = (categoryId: string, updates: Partial<TimeBudgetCategory>) => {
    setCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId ? { ...cat, ...updates } : cat
      )
    );
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      categories, 
      setUser, 
      updateCategory, 
      completeOnboarding,
      isLoading 
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
