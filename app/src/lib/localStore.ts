/**
 * Local storage persistence for demo mode (when Supabase is not configured).
 * Events are keyed by their share_slug.
 */

import type { CelebrationEvent, Wish } from './types';

const STORAGE_KEY = 'celebrate_together_events';

function getAll(): Record<string, CelebrationEvent> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function saveEventLocally(event: CelebrationEvent): void {
  if (typeof window === 'undefined') return;
  const all = getAll();
  all[event.share_slug] = event;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function getEventBySlug(slug: string): CelebrationEvent | null {
  const all = getAll();
  return all[slug] ?? null;
}

export function deleteEventLocally(id: string): void {
  const all = getAll();
  const updated = Object.fromEntries(
    Object.entries(all).filter(([, ev]) => ev.id !== id)
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getAllLocalEvents(): CelebrationEvent[] {
  return Object.values(getAll()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

const WISHES_STORAGE_KEY = 'celebrate_together_wishes';

function getAllWishes(): Record<string, Wish[]> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(WISHES_STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function saveWishLocally(wish: Wish): void {
  if (typeof window === 'undefined') return;
  const all = getAllWishes();
  if (!all[wish.event_id]) {
    all[wish.event_id] = [];
  }
  all[wish.event_id].push(wish);
  localStorage.setItem(WISHES_STORAGE_KEY, JSON.stringify(all));
}

export function getWishesLocally(eventId: string): Wish[] {
  const all = getAllWishes();
  return (all[eventId] ?? []).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
