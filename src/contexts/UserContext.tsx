import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  reorderCategories: (orderedIds: string[]) => void;
  addCustomSuggestion: (categoryName: string, suggestion: string) => void;
  removeCustomSuggestion: (categoryName: string, suggestion: string) => void;
  addGoal: (categoryId: string, text: string) => void;
  updateGoal: (goalId: string, text: string) => void;
  removeGoal: (goalId: string) => void;
  reorderGoals: (orderedIds: string[]) => void;
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
  const categoriesLoadedFromDB = useRef(false);
  // Load goals from database
  const loadGoalsFromDB = async (userId: string) => {
    const { data, error } = await supabase
      .from('life_goals')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error loading goals:', error);
      return null;
    }
    return data;
  };

  // Sync goals to database
  const syncGoalsToDB = async (userId: string, goalsToSync: LifeGoal[]) => {
    // Delete all existing goals for user, then insert current ones
    const { error: deleteError } = await supabase
      .from('life_goals')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting goals:', deleteError);
      return;
    }

    if (goalsToSync.length === 0) return;

    const rows = goalsToSync.map((g, i) => ({
      user_id: userId,
      category_id: g.categoryId,
      text: g.text,
      sort_order: i,
    }));

    const { error: insertError } = await supabase
      .from('life_goals')
      .insert(rows);

    if (insertError) {
      console.error('Error inserting goals:', insertError);
    }
  };

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
    let initialSessionHandled = false;

    const handleSession = async (session: any) => {
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

          // Load categories from DB if present
          const dbCategories = (profile as any).categories;
          if (Array.isArray(dbCategories) && dbCategories.length > 0) {
            setCategories(dbCategories as TimeBudgetCategory[]);
          } else {
            // Migrate localStorage categories to DB
            const savedCategories = localStorage.getItem('lifewealth_categories');
            if (savedCategories) {
              const parsed = JSON.parse(savedCategories) as TimeBudgetCategory[];
              if (parsed.length > 0) {
                setCategories(parsed);
                await supabase.from('profiles').update({ categories: parsed as any }).eq('user_id', session.user.id);
              }
            }
          }
          categoriesLoadedFromDB.current = true;

          // Load goals from DB
          const dbGoals = await loadGoalsFromDB(session.user.id);
          if (dbGoals && dbGoals.length > 0) {
            setGoals(dbGoals.map(g => ({ id: g.id, categoryId: g.category_id, text: g.text })));
          } else {
            // Migrate localStorage goals to DB if any
            const savedGoals = localStorage.getItem('lifewealth_goals');
            if (savedGoals) {
              const localGoals: LifeGoal[] = JSON.parse(savedGoals);
              if (localGoals.length > 0) {
                setGoals(localGoals);
                await syncGoalsToDB(session.user.id, localGoals);
              }
            }
          }
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
          } else {
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    // Listen to auth state changes - skip if initial session already handled
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!initialSessionHandled) return; // let getSession handle the first one
        await handleSession(session);
      }
    );

    // Check for existing session (single call, no duplicate)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      initialSessionHandled = true;
      await handleSession(session);
    });

    // Load localStorage-based settings
    const savedCategories = localStorage.getItem('lifewealth_categories');
    if (savedCategories) {
      const parsed: TimeBudgetCategory[] = JSON.parse(savedCategories);
      const palette = ['9','5','7','4','2','10','3','6','1','8','11'];
      const used = new Set<string>();
      const migrated = parsed.map((cat, idx) => {
        const defaultMatch = DEFAULT_CATEGORIES.find(
          d => d.name.toLowerCase() === cat.name.trim().toLowerCase()
        );
        let colorId = cat.googleColorId;
        // Backfill if missing or if this looks like an unmigrated all-'1' set
        if (!colorId || colorId === '1') {
          colorId = defaultMatch?.googleColorId || palette[idx % palette.length];
        }
        // Ensure uniqueness across categories
        while (used.has(colorId)) {
          colorId = palette[(palette.indexOf(colorId) + 1) % palette.length];
        }
        used.add(colorId);
        return { ...cat, googleColorId: colorId };
      });
      setCategories(migrated);
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
      // Persist to DB if authenticated and initial load is done
      if (categoriesLoadedFromDB.current) {
        (async () => {
          const { data } = await supabase.auth.getSession();
          const uid = data.session?.user?.id;
          if (uid) {
            await supabase.from('profiles').update({ categories: categories as any }).eq('user_id', uid);
          }
        })();
      }
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

  const getAuthUserId = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id || null;
  };

  const addGoal = async (categoryId: string, text: string) => {
    const userId = await getAuthUserId();
    if (userId) {
      const { data, error } = await supabase
        .from('life_goals')
        .insert({ user_id: userId, category_id: categoryId, text, sort_order: goals.length })
        .select()
        .single();
      if (!error && data) {
        setGoals(prev => [...prev, { id: data.id, categoryId: data.category_id, text: data.text }]);
        return;
      }
    }
    const newGoal: LifeGoal = { id: `goal_${Date.now()}`, categoryId, text };
    setGoals(prev => [...prev, newGoal]);
  };

  const updateGoal = async (goalId: string, text: string) => {
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, text } : g));
    const userId = await getAuthUserId();
    if (userId) {
      await supabase.from('life_goals').update({ text, updated_at: new Date().toISOString() }).eq('id', goalId).eq('user_id', userId);
    }
  };

  const removeGoal = async (goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
    const userId = await getAuthUserId();
    if (userId) {
      await supabase.from('life_goals').delete().eq('id', goalId).eq('user_id', userId);
    }
  };

  const reorderCategories = (orderedIds: string[]) => {
    setCategories(prev => {
      const map = new Map(prev.map(c => [c.id, c]));
      return orderedIds.map(id => map.get(id)!).filter(Boolean);
    });
  };

  const reorderGoals = async (orderedIds: string[]) => {
    setGoals(prev => {
      const map = new Map(prev.map(g => [g.id, g]));
      return orderedIds.map(id => map.get(id)!).filter(Boolean);
    });
    const userId = await getAuthUserId();
    if (userId) {
      // Update sort_order for each goal
      await Promise.all(orderedIds.map((id, i) =>
        supabase.from('life_goals').update({ sort_order: i }).eq('id', id).eq('user_id', userId)
      ));
    }
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
      reorderCategories,
      addCustomSuggestion,
      removeCustomSuggestion,
      addGoal,
      updateGoal,
      removeGoal,
      reorderGoals,
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
