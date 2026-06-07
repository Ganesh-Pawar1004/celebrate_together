import type { EventType } from './types';

export interface MusicTrack {
  id: string;
  label: string;
  emoji: string;
  /** Relative to /public or absolute URL. Empty for 'none'/'custom'. */
  url: string;
  occasions: EventType[];
}

/**
 * Preset tracks — hosted locally in /public/music/ (royalty-free from SoundHelix).
 * 'custom' is a virtual entry that signals the user has uploaded their own file.
 */
export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'none',
    label: 'No music',
    emoji: '🔇',
    url: '',
    occasions: [],
  },
  {
    id: 'happy_upbeat',
    label: 'Happy & Upbeat',
    emoji: '🎉',
    url: '/music/upbeat.mp3',
    occasions: ['birthday', 'graduation', 'promotion', 'housewarming', 'just_because'],
  },
  {
    id: 'romantic_piano',
    label: 'Romantic Piano',
    emoji: '🎹',
    url: '/music/romantic.mp3',
    occasions: ['anniversary', 'valentine', 'engagement'],
  },
  {
    id: 'soft_lullaby',
    label: 'Soft & Dreamy',
    emoji: '🍼',
    url: '/music/soft.mp3',
    occasions: ['baby_shower'],
  },
  {
    id: 'acoustic_warm',
    label: 'Warm Acoustic',
    emoji: '🎸',
    url: '/music/acoustic.mp3',
    occasions: ['birthday', 'just_because', 'housewarming'],
  },
  {
    id: 'cinematic',
    label: 'Cinematic',
    emoji: '🎬',
    url: '/music/cinematic.mp3',
    occasions: ['engagement', 'graduation', 'promotion'],
  },
  {
    id: 'search',
    label: 'Search Free Library',
    emoji: '🔍',
    url: '',
    occasions: [],
  },
  {
    id: 'custom',
    label: 'Upload your own',
    emoji: '📂',
    url: '', // actual URL comes from custom_music_data (base64 data URI)
    occasions: [],
  },
];

export function getDefaultTrack(occasion: EventType): MusicTrack {
  const match = MUSIC_TRACKS.find(
    (t) => t.id !== 'none' && t.id !== 'custom' && t.occasions.includes(occasion)
  );
  return match ?? MUSIC_TRACKS[1]; // default: happy_upbeat
}

/** Fade volume from 0 → target over durationMs */
export function fadeIn(audio: HTMLAudioElement, targetVolume = 0.65, durationMs = 2500): void {
  audio.volume = 0;
  const steps = 50;
  const interval = durationMs / steps;
  const increment = targetVolume / steps;
  let current = 0;
  const timer = setInterval(() => {
    current += increment;
    audio.volume = Math.min(current, targetVolume);
    if (audio.volume >= targetVolume) clearInterval(timer);
  }, interval);
}

/** Fade volume to 0 over durationMs then pause */
export function fadeOut(audio: HTMLAudioElement, durationMs = 1200): void {
  const start = audio.volume;
  const steps = 30;
  const interval = durationMs / steps;
  const decrement = start / steps;
  const timer = setInterval(() => {
    audio.volume = Math.max(audio.volume - decrement, 0);
    if (audio.volume <= 0) { clearInterval(timer); audio.pause(); }
  }, interval);
}
