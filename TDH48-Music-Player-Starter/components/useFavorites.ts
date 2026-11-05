'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active || !user) return;
      setUserId(user.id);
      const { data, error } = await supabase.from('favorites').select('track_id').eq('user_id', user.id);
      if (!active) return;
      if (error) { console.warn('Could not load favorites:', error.message); return; }
      setFavoriteIds((data || []).map(row => row.track_id));
    })();
    const onChanged = (event: Event) => {
      const detail = (event as CustomEvent<{trackId:string;isFavorite:boolean}>).detail;
      if (!detail?.trackId) return;
      setFavoriteIds(current => detail.isFavorite
        ? current.includes(detail.trackId) ? current : [...current, detail.trackId]
        : current.filter(id => id !== detail.trackId));
    };
    window.addEventListener('tdh48:favorites-changed', onChanged);
    return () => { active = false; window.removeEventListener('tdh48:favorites-changed', onChanged); };
  }, []);

  const toggleFavorite = useCallback(async (trackId: string) => {
    if (!userId) return;
    const wasFavorite = favoriteIds.includes(trackId);
    setFavoriteIds(current => wasFavorite ? current.filter(id => id !== trackId) : [...current, trackId]);
    const supabase = createClient();
    const result = wasFavorite
      ? await supabase.from('favorites').delete().eq('user_id', userId).eq('track_id', trackId)
      : await supabase.from('favorites').insert({ user_id: userId, track_id: trackId });
    if (result.error) {
      setFavoriteIds(current => wasFavorite ? [...current, trackId] : current.filter(id => id !== trackId));
      console.warn('Could not update favorite:', result.error.message);
      return;
    }
    window.dispatchEvent(new CustomEvent('tdh48:favorites-changed', { detail: { trackId, isFavorite: !wasFavorite } }));
  }, [favoriteIds, userId]);

  return { favoriteIds, isFavorite: (id: string) => favoriteIds.includes(id), toggleFavorite };
}
