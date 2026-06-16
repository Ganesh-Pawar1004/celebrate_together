export type EventType =
  | 'birthday'
  | 'anniversary'
  | 'baby_shower'
  | 'valentine'
  | 'engagement'
  | 'graduation'
  | 'promotion'
  | 'housewarming'
  | 'just_because'
  | 'farewell'
  | 'retirement'
  | 'get_well_soon'
  | 'new_job'
  | 'custom';

export type Theme =
  | 'romantic'
  | 'joyful'
  | 'elegant'
  | 'cute'
  | 'dark_glam'
  | 'fresh'
  | 'golden_sunset';

export interface CelebrationEvent {
  id: string;
  creator_id: string | null;
  event_type: EventType;
  /** Used when event_type is 'custom' — the creator defines what's being celebrated */
  custom_label?: string | null;
  recipient_name: string;
  sender_name: string;
  custom_message: string;
  scheduled_at: string; // ISO string
  timezone: string;
  theme: Theme;
  music_preset: string | null;
  /** base64 data URI of user-uploaded audio (when music_preset === 'custom') */
  custom_music_data?: string | null;
  photo_url: string | null;
  share_slug: string;
  is_active: boolean;
  created_at: string;
  view_count: number;
  cake_flavor?: 'chocolate' | 'vanilla' | 'strawberry' | 'red-velvet' | null;
  additional_photos?: string | null; // JSON string array of base64 images
}

export interface Wish {
  id: string;
  event_id: string;
  name: string;
  message: string;
  created_at: string;
}

export interface Reaction {
  id: string;
  event_id: string;
  emoji: string;
  message: string | null;
  created_at: string;
}

export const EVENT_LABELS: Record<EventType, { label: string; emoji: string; description: string }> = {
  birthday:      { label: 'Birthday',        emoji: '🎂', description: 'Celebrate another trip around the sun' },
  anniversary:   { label: 'Anniversary',     emoji: '💍', description: 'Cherish your special milestone' },
  baby_shower:   { label: 'Baby Shower',     emoji: '🍼', description: 'Welcome the little one' },
  valentine:     { label: "Valentine's Day", emoji: '💑', description: 'Celebrate love & romance' },
  engagement:    { label: 'Engagement',      emoji: '💎', description: 'The beginning of forever' },
  graduation:    { label: 'Graduation',      emoji: '🎓', description: 'Celebrate their big achievement' },
  promotion:     { label: 'Job Promotion',   emoji: '💼', description: 'Cheers to leveling up!' },
  housewarming:  { label: 'Housewarming',    emoji: '🏠', description: 'Welcome home!' },
  just_because:  { label: 'Just Because',    emoji: '🎉', description: 'No reason needed — spread joy' },
  farewell:      { label: 'Farewell',        emoji: '👋', description: 'Send them off with warmth & love' },
  retirement:    { label: 'Retirement',      emoji: '🏖️', description: 'Celebrate a legendary career' },
  get_well_soon: { label: 'Get Well Soon',   emoji: '🌸', description: 'Send healing thoughts & warmth' },
  new_job:       { label: 'New Job',         emoji: '🚀', description: 'Cheer them on their next chapter' },
  custom:        { label: 'Custom',          emoji: '✨', description: 'Make it completely your own' },
};

export const THEME_LABELS: Record<Theme, { label: string; description: string }> = {
  romantic:      { label: 'Romantic',      description: 'Deep rose & gold — for lovers' },
  joyful:        { label: 'Joyful',        description: 'Bright coral & sunshine — fun & cheerful' },
  elegant:       { label: 'Elegant',       description: 'Champagne & ivory — refined & classic' },
  cute:          { label: 'Cute',          description: 'Soft pink & mint — sweet & playful' },
  dark_glam:     { label: 'Dark Glam',     description: 'Midnight & violet — dramatic & magical' },
  fresh:         { label: 'Fresh',         description: 'Forest green & cream — natural & calm' },
  golden_sunset: { label: 'Golden Sunset', description: 'Warm amber & gold — bittersweet & hopeful' },
};

/** Suggested theme per event type — can be overridden by the user */
export const THEME_SUGGESTIONS: Record<EventType, Theme> = {
  birthday:      'joyful',
  anniversary:   'romantic',
  baby_shower:   'cute',
  valentine:     'romantic',
  engagement:    'romantic',
  graduation:    'dark_glam',
  promotion:     'elegant',
  housewarming:  'fresh',
  just_because:  'joyful',
  farewell:      'golden_sunset',
  retirement:    'golden_sunset',
  get_well_soon: 'fresh',
  new_job:       'elegant',
  custom:        'joyful',
};
