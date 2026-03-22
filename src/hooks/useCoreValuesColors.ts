import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useCoreValuesColors(userId: string | undefined) {
  const [valuesColors, setValuesColors] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      if (userId) {
        const { data } = await supabase
          .from('core_values_shortlist')
          .select('colors')
          .eq('user_id', userId)
          .maybeSingle();
        if (data && data.colors && Object.keys(data.colors as Record<string, string>).length > 0) {
          setValuesColors(data.colors as Record<string, string>);
          return;
        }
      }
      // Fallback to localStorage
      const saved = localStorage.getItem('core-values-colors');
      if (saved) {
        const parsed = JSON.parse(saved);
        setValuesColors(parsed);
        // Migrate to DB if authenticated
        if (userId && Object.keys(parsed).length > 0) {
          await supabase
            .from('core_values_shortlist')
            .update({ colors: parsed })
            .eq('user_id', userId);
        }
      }
    };
    load();
  }, [userId]);

  const updateColor = useCallback(async (value: string, color: string) => {
    const updated = { ...valuesColors, [value]: color };
    setValuesColors(updated);
    localStorage.setItem('core-values-colors', JSON.stringify(updated));
    if (userId) {
      await supabase
        .from('core_values_shortlist')
        .update({ colors: updated })
        .eq('user_id', userId);
    }
  }, [valuesColors, userId]);

  const resetColors = useCallback(() => {
    setValuesColors({});
  }, []);

  return { valuesColors, updateColor, resetColors };
}
