import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, TimeBudgetCategory, DEFAULT_CATEGORIES } from '@/types/user';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LifeGoal {
  id: string;
  categoryId: string;
  text: string;
}

export interface CapitalAsset {
  id: string;
  capitalId: string;
  name: string;
  value: string;
}

export interface SocialRelationship {
  id: string;
  name: string;
  reliability: number;
  vulnerability: number;
  resourceFlow: number;
  influence: number;
}

interface UserContextType {
  user: UserProfile | null;
  categories: TimeBudgetCategory[];
  customSuggestions: Record<string, string[]>;
  goals: LifeGoal[];
  capitalRatings: Record<string, number>;
  capitalAssets: CapitalAsset[];
  socialRelationships: SocialRelationship[];
  financialConfig: { yearlyExpenses: number; yearlyROI: number };
  capitalTabEnabled: boolean;
  dailyReviewTime: string | null; // HH:mm format, null = disabled
  dailyReviewCompletedToday: boolean;
  setUser: (user: UserProfile | null) => void;
  updateCategory: (categoryId: string, updates: Partial<TimeBudgetCategory>) => void;
  resetCategories: () => void;
  addCategory: (name: string, description?: string) => void;
  deleteCategory: (categoryId: string) => void;
  addCustomSuggestion: (categoryName: string, suggestion: string) => void;
  removeCustomSuggestion: (categoryName: string, suggestion: string) => void;
  addGoal: (categoryId: string, text: string) => void;
  updateGoal: (goalId: string, text: string) => void;
  removeGoal: (goalId: string) => void;
  setCapitalRating: (capitalId: string, rating: number) => void;
  addCapitalAsset: (capitalId: string, name: string, value: string) => void;
  updateCapitalAsset: (assetId: string, updates: Partial<Pick<CapitalAsset, 'name' | 'value'>>) => void;
  removeCapitalAsset: (assetId: string) => void;
  addSocialRelationship: (name: string) => void;
  updateSocialRelationship: (id: string, updates: Partial<Omit<SocialRelationship, 'id'>>) => void;
  removeSocialRelationship: (id: string) => void;
  setFinancialConfig: (config: { yearlyExpenses?: number; yearlyROI?: number }) => void;
  setCapitalTabEnabled: (enabled: boolean) => void;
  setDailyReviewTime: (time: string | null) => void;
  markDailyReviewCompleted: () => void;
  completeOnboarding: (userData: Partial<UserProfile>) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [categories, setCategories] = useState<TimeBudgetCategory[]>([]);
  const [customSuggestions, setCustomSuggestions] = useState<Record<string, string[]>>({});
  const [goals, setGoals] = useState<LifeGoal[]>([]);
  const [capitalRatings, setCapitalRatings] = useState<Record<string, number>>({});
  const [capitalAssets, setCapitalAssets] = useState<CapitalAsset[]>([]);
  const [financialConfig, setFinancialConfigState] = useState<{ yearlyExpenses: number; yearlyROI: number }>({ yearlyExpenses: 0, yearlyROI: 0 });
  const [socialRelationships, setSocialRelationships] = useState<SocialRelationship[]>([]);
  const [capitalTabEnabled, setCapitalTabEnabled] = useState(false);
  const [dailyReviewTime, setDailyReviewTimeState] = useState<string | null>(null);
  const [dailyReviewCompletedToday, setDailyReviewCompletedToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile from database for authenticated user
  const loadProfileFromDB = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error loading profile:', error);
      return null;
    }
    return data;
  };

  // Save profile to database
  const saveProfileToDB = async (userId: string, profileData: {
    name: string;
    age: number;
    expected_lifespan: number;
    birth_date: string;
    onboarding_complete: boolean;
  }) => {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        ...profileData,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error saving profile:', error);
    }
  };

  useEffect(() => {
    // Listen to auth state changes to load profile from DB
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Load profile from database
          const profile = await loadProfileFromDB(session.user.id);
          if (profile && profile.onboarding_complete) {
            const birthDate = profile.birth_date ? new Date(profile.birth_date) : new Date();
            setUser({
              id: session.user.id,
              name: profile.name,
              email: session.user.email || '',
              age: profile.age,
              expectedLifespan: profile.expected_lifespan,
              birthDate,
              role: 'user',
              createdAt: new Date(profile.created_at),
              lastLogin: new Date(),
              onboardingComplete: true,
            });
          } else {
            // Check localStorage as fallback for existing users
            const savedUser = localStorage.getItem('lifewealth_user');
            if (savedUser) {
              const parsed = JSON.parse(savedUser);
              setUser({
                ...parsed,
                id: session.user.id,
                birthDate: new Date(parsed.birthDate),
                createdAt: new Date(parsed.createdAt),
                lastLogin: new Date(parsed.lastLogin),
              });
              // Migrate localStorage data to DB
              if (parsed.onboardingComplete) {
                await saveProfileToDB(session.user.id, {
                  name: parsed.name,
                  age: parsed.age,
                  expected_lifespan: parsed.expectedLifespan,
                  birth_date: new Date(parsed.birthDate).toISOString(),
                  onboarding_complete: true,
                });
              }
            } else {
              // No profile yet - user needs onboarding
              setUser(null);
            }
          }
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await loadProfileFromDB(session.user.id);
        if (profile && profile.onboarding_complete) {
          const birthDate = profile.birth_date ? new Date(profile.birth_date) : new Date();
          setUser({
            id: session.user.id,
            name: profile.name,
            email: session.user.email || '',
            age: profile.age,
            expectedLifespan: profile.expected_lifespan,
            birthDate,
            role: 'user',
            createdAt: new Date(profile.created_at),
            lastLogin: new Date(),
            onboardingComplete: true,
          });
        } else {
          const savedUser = localStorage.getItem('lifewealth_user');
          if (savedUser) {
            const parsed = JSON.parse(savedUser);
            setUser({
              ...parsed,
              id: session.user.id,
              birthDate: new Date(parsed.birthDate),
              createdAt: new Date(parsed.createdAt),
              lastLogin: new Date(parsed.lastLogin),
            });
            if (parsed.onboardingComplete) {
              await saveProfileToDB(session.user.id, {
                name: parsed.name,
                age: parsed.age,
                expected_lifespan: parsed.expectedLifespan,
                birth_date: new Date(parsed.birthDate).toISOString(),
                onboarding_complete: true,
              });
            }
          }
        }
      }
      setIsLoading(false);
    });

    // Load localStorage-based settings
    const savedCategories = localStorage.getItem('lifewealth_categories');
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
    if (savedSuggestions) setCustomSuggestions(JSON.parse(savedSuggestions));

    const savedGoals = localStorage.getItem('lifewealth_goals');
    if (savedGoals) setGoals(JSON.parse(savedGoals));

    const savedCapital = localStorage.getItem('lifewealth_capital_ratings');
    if (savedCapital) setCapitalRatings(JSON.parse(savedCapital));

    const savedAssets = localStorage.getItem('lifewealth_capital_assets');
    if (savedAssets) setCapitalAssets(JSON.parse(savedAssets));

    const savedRelationships = localStorage.getItem('lifewealth_social_relationships');
    if (savedRelationships) setSocialRelationships(JSON.parse(savedRelationships));

    const savedFinConfig = localStorage.getItem('lifewealth_financial_config');
    if (savedFinConfig) setFinancialConfigState(JSON.parse(savedFinConfig));

    const savedCapitalTab = localStorage.getItem('lifewealth_capital_tab_enabled');
    if (savedCapitalTab) setCapitalTabEnabled(JSON.parse(savedCapitalTab));

    const savedReviewTime = localStorage.getItem('lifewealth_daily_review_time');
    if (savedReviewTime) setDailyReviewTimeState(JSON.parse(savedReviewTime));

    const completedDate = localStorage.getItem('lifewealth_review_completed_date');
    const today = new Date().toISOString().slice(0, 10);
    setDailyReviewCompletedToday(completedDate === today);

    return () => subscription.unsubscribe();
  }, []);

  // Keep localStorage in sync for non-profile data
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

  useEffect(() => {
    localStorage.setItem('lifewealth_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('lifewealth_capital_ratings', JSON.stringify(capitalRatings));
  }, [capitalRatings]);

  useEffect(() => {
    localStorage.setItem('lifewealth_capital_assets', JSON.stringify(capitalAssets));
  }, [capitalAssets]);

  useEffect(() => {
    localStorage.setItem('lifewealth_social_relationships', JSON.stringify(socialRelationships));
  }, [socialRelationships]);

  useEffect(() => {
    localStorage.setItem('lifewealth_financial_config', JSON.stringify(financialConfig));
  }, [financialConfig]);

  useEffect(() => {
    localStorage.setItem('lifewealth_capital_tab_enabled', JSON.stringify(capitalTabEnabled));
  }, [capitalTabEnabled]);

  const completeOnboarding = async (userData: Partial<UserProfile>) => {
    const session = (await supabase.auth.getSession()).data.session;
    const userId = session?.user?.id || `user_${Date.now()}`;

    const newUser: UserProfile = {
      id: userId,
      name: userData.name || 'User',
      email: session?.user?.email || userData.email || '',
      age: userData.age || 30,
      expectedLifespan: userData.expectedLifespan || 80,
      birthDate: userData.birthDate || new Date(new Date().getFullYear() - 30, 0, 1),
      role: 'user',
      createdAt: new Date(),
      lastLogin: new Date(),
      onboardingComplete: true,
    };
    setUser(newUser);

    // Persist to database if authenticated
    if (session?.user) {
      await saveProfileToDB(session.user.id, {
        name: newUser.name,
        age: newUser.age,
        expected_lifespan: newUser.expectedLifespan,
        birth_date: newUser.birthDate.toISOString(),
        onboarding_complete: true,
      });
    }
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
    setCustomSuggestions(prev => {
      const next = { ...prev };
      delete next[cat.name];
      return next;
    });
    toast.success(`Removed "${cat.name}" category`);
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

  const addGoal = (categoryId: string, text: string) => {
    const newGoal: LifeGoal = { id: `goal_${Date.now()}`, categoryId, text };
    setGoals(prev => [...prev, newGoal]);
  };

  const updateGoal = (goalId: string, text: string) => {
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, text } : g));
  };

  const removeGoal = (goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
  };

  const setCapitalRating = (capitalId: string, rating: number) => {
    setCapitalRatings(prev => ({ ...prev, [capitalId]: rating }));
  };

  const addCapitalAsset = (capitalId: string, name: string, value: string) => {
    const newAsset: CapitalAsset = { id: `asset_${Date.now()}`, capitalId, name, value };
    setCapitalAssets(prev => [...prev, newAsset]);
  };

  const updateCapitalAsset = (assetId: string, updates: Partial<Pick<CapitalAsset, 'name' | 'value'>>) => {
    setCapitalAssets(prev => prev.map(a => a.id === assetId ? { ...a, ...updates } : a));
  };

  const removeCapitalAsset = (assetId: string) => {
    setCapitalAssets(prev => prev.filter(a => a.id !== assetId));
  };

  const addSocialRelationship = (name: string) => {
    const newRel: SocialRelationship = { id: `rel_${Date.now()}`, name, reliability: 0, vulnerability: 0, resourceFlow: 0, influence: 0 };
    setSocialRelationships(prev => [...prev, newRel]);
  };

  const updateSocialRelationship = (id: string, updates: Partial<Omit<SocialRelationship, 'id'>>) => {
    setSocialRelationships(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const setFinancialConfig = (config: { yearlyExpenses?: number; yearlyROI?: number }) => {
    setFinancialConfigState(prev => ({ ...prev, ...config }));
  };

  const removeSocialRelationship = (id: string) => {
    setSocialRelationships(prev => prev.filter(r => r.id !== id));
  };

  const setDailyReviewTime = (time: string | null) => {
    setDailyReviewTimeState(time);
    localStorage.setItem('lifewealth_daily_review_time', JSON.stringify(time));
  };

  const markDailyReviewCompleted = () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('lifewealth_review_completed_date', today);
    setDailyReviewCompletedToday(true);
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      categories, 
      customSuggestions,
      goals,
      capitalRatings,
      capitalAssets,
      socialRelationships,
      financialConfig,
      capitalTabEnabled,
      setUser, 
      updateCategory,
      resetCategories,
      addCategory,
      deleteCategory,
      addCustomSuggestion,
      removeCustomSuggestion,
      addGoal,
      updateGoal,
      removeGoal,
      setCapitalRating,
      addCapitalAsset,
      updateCapitalAsset,
      removeCapitalAsset,
      addSocialRelationship,
      updateSocialRelationship,
      removeSocialRelationship,
      setFinancialConfig,
      setCapitalTabEnabled,
      dailyReviewTime,
      dailyReviewCompletedToday,
      setDailyReviewTime,
      markDailyReviewCompleted,
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
