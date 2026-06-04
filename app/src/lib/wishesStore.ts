import { supabase, isSupabaseConfigured } from './supabase';
import { saveWishLocally, getWishesLocally } from './localStore';
import type { Wish } from './types';

export async function addWish(eventId: string, name: string, message: string): Promise<Wish> {
  const newWish: Wish = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    event_id: eventId,
    name,
    message,
    created_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured) {
    saveWishLocally(newWish);
    return newWish;
  }

  try {
    const { data, error } = await supabase
      .from('wishes')
      .insert({
        id: newWish.id,
        event_id: newWish.event_id,
        name: newWish.name,
        message: newWish.message,
        created_at: newWish.created_at,
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase wishes insert error, falling back to local storage:', error);
      saveWishLocally(newWish);
      return newWish;
    }
    return data ?? newWish;
  } catch (err) {
    console.error('Supabase error inserting wish, using local storage fallback:', err);
    saveWishLocally(newWish);
    return newWish;
  }
}

export async function getWishes(eventId: string): Promise<Wish[]> {
  if (!isSupabaseConfigured) {
    return getWishesLocally(eventId);
  }

  try {
    const { data, error } = await supabase
      .from('wishes')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase wishes fetch error, falling back to local storage:', error);
      return getWishesLocally(eventId);
    }
    return data ?? getWishesLocally(eventId);
  } catch (err) {
    console.error('Supabase error fetching wishes, using local storage fallback:', err);
    return getWishesLocally(eventId);
  }
}
