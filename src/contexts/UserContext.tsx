import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, TimeBudgetCategory, DEFAULT_CATEGORIES } from '@/types/user';
import { toast } from 'sonner';

interface UserContextType {
  user: UserProfile | null;
  categories: TimeBudgetCategory[];
  customSuggestions: Record<string, string[]>;
  setUser: (user: UserProfile | null) => void;
  updateCategory: (categoryId: string, updates: Partial<TimeBudgetCategory>) => void;
  resetCategories: () => void;
  addCategory: (name: string, description?: string) => void;
  deleteCategory: (categoryId: string) => void;
  addCustomSuggestion: (categoryName: string, suggestion: string) => void;
  removeCustomSuggestion: (categoryName: string, suggestion: string) => void;
  completeOnboarding: (userData: Partial<UserProfile>) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [categories, setCategories] = useState<TimeBudgetCategory[]>([]);
  const [customSuggestions, setCustomSuggestions] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
      const initialCategories = DEFAULT_CATEGORIES.map((cat, index) => ({
        ...cat,
        id: `cat_${index}`,
        weeklyHoursActual: 0,
        googleColorId: cat.googleColorId || '1',
      }));
      setCategories(initialCategories);
    }

    const savedSuggestions = localStorage.getItem('lifewealth_custom_suggestions');
    if (savedSuggestions) {
      setCustomSuggestions(JSON.parse(savedSuggestions));
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

  useEffect(() => {
    localStorage.setItem('lifewealth_custom_suggestions', JSON.stringify(customSuggestions));
  }, [customSuggestions]);

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

  const resetCategories = () => {
    const initialCategories = DEFAULT_CATEGORIES.map((cat, index) => ({
      ...cat,
      id: `cat_${index}`,
      weeklyHoursActual: 0,
      googleColorId: cat.googleColorId || '1',
    }));
    setCategories(initialCategories);
    setCustomSuggestions({});
    toast.success('Life areas reset to defaults');
  };

  const updateCategory = (categoryId: string, updates: Partial<TimeBudgetCategory>) => {
    setCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId ? { ...cat, ...updates } : cat
      )
    );
  };

  const addCategory = (name: string, description?: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    if (categories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast.error('A category with that name already exists');
      return;
    }
    const newCategory: TimeBudgetCategory = {
      id: `cat_${Date.now()}`,
      name: trimmedName,
      icon: 'target',
      color: trimmedName.toLowerCase().replace(/\s+/g, '-'),
      googleColorId: '1',
      weeklyHoursTarget: 2,
      weeklyHoursActual: 0,
      description: description || '',
    };
    setCategories(prev => [...prev, newCategory]);
    toast.success(`Added "${trimmedName}" category`);
  };

  const deleteCategory = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return;
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    // Clean up custom suggestions for this category
    setCustomSuggestions(prev => {
      const next = { ...prev };
      delete next[cat.name];
      return next;
    });
    toast.success(`Removed "${cat.name}" category`);
    // Note: task cleanup happens via the useTasks hook on the backend (life_areas column)
  };

  const addCustomSuggestion = (categoryName: string, suggestion: string) => {
    setCustomSuggestions(prev => ({
      ...prev,
      [categoryName]: [...(prev[categoryName] || []), suggestion],
    }));
  };

  const removeCustomSuggestion = (categoryName: string, suggestion: string) => {
    setCustomSuggestions(prev => ({
      ...prev,
      [categoryName]: (prev[categoryName] || []).filter(s => s !== suggestion),
    }));
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      categories, 
      customSuggestions,
      setUser, 
      updateCategory,
      resetCategories,
      addCategory,
      deleteCategory,
      addCustomSuggestion,
      removeCustomSuggestion,
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
