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
  | 'custom';

export type Theme =
  | 'romantic'
  | 'joyful'
  | 'elegant'
  | 'cute'
  | 'dark_glam'
  | 'fresh';

export interface CelebrationEvent {
  id: string;
  creator_id: string | null;
  event_type: EventType;
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

export const EVENT_LABELS: Record<EventType, { label: string; emoji: string }> = {
  birthday: { label: 'Birthday', emoji: '🎂' },
  anniversary: { label: 'Anniversary', emoji: '💍' },
  baby_shower: { label: 'Baby Shower', emoji: '🍼' },
  valentine: { label: "Valentine's Day", emoji: '💑' },
  engagement: { label: 'Engagement', emoji: '💎' },
  graduation: { label: 'Graduation', emoji: '🎓' },
  promotion: { label: 'Job Promotion', emoji: '💼' },
  housewarming: { label: 'Housewarming', emoji: '🏠' },
  just_because: { label: 'Just Because', emoji: '🎉' },
  custom: { label: 'Custom', emoji: '✨' },
};

export const THEME_LABELS: Record<Theme, { label: string; description: string }> = {
  romantic: { label: 'Romantic', description: 'Deep rose & gold — for lovers' },
  joyful: { label: 'Joyful', description: 'Bright coral & sunshine — fun & cheerful' },
  elegant: { label: 'Elegant', description: 'Champagne & ivory — refined & classic' },
  cute: { label: 'Cute', description: 'Soft pink & mint — sweet & playful' },
  dark_glam: { label: 'Dark Glam', description: 'Midnight & violet — dramatic & magical' },
  fresh: { label: 'Fresh', description: 'Forest green & cream — natural & calm' },
};
