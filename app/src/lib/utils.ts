import { customAlphabet } from 'nanoid';
import { format, formatDistanceToNow } from 'date-fns';
import type { Theme, EventType } from './types';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);

export function generateSlug(): string {
  return nanoid();
}

export function formatScheduledDate(isoString: string): string {
  return format(new Date(isoString), 'PPP p');
}

export function getTimeUntil(isoString: string): string {
  return formatDistanceToNow(new Date(isoString), { addSuffix: true });
}

export function isRevealed(isoString: string): boolean {
  return new Date(isoString) <= new Date();
}

export function getCountdownParts(isoString: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const diff = new Date(isoString).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };

  const total = diff;
  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, total };
}

export interface ThemeTokens {
  '--bg-primary': string;
  '--bg-secondary': string;
  '--bg-surface': string;
  '--text-primary': string;
  '--text-secondary': string;
  '--accent-primary': string;
  '--accent-secondary': string;
  '--border-color': string;
  '--particle-color': string;
}

export const THEME_TOKENS: Record<Theme, ThemeTokens> = {
  romantic: {
    '--bg-primary': '#1a0a10',
    '--bg-secondary': '#2d1020',
    '--bg-surface': '#3d1830',
    '--text-primary': '#ffeef5',
    '--text-secondary': '#f4a8c4',
    '--accent-primary': '#e8386d',
    '--accent-secondary': '#c9a84c',
    '--border-color': '#6b2040',
    '--particle-color': '#e8386d',
  },
  joyful: {
    '--bg-primary': '#0f1a2e',
    '--bg-secondary': '#1a2a40',
    '--bg-surface': '#243650',
    '--text-primary': '#fff8f0',
    '--text-secondary': '#ffd4a8',
    '--accent-primary': '#ff6b35',
    '--accent-secondary': '#ffd166',
    '--border-color': '#2a4060',
    '--particle-color': '#ff6b35',
  },
  elegant: {
    '--bg-primary': '#120e08',
    '--bg-secondary': '#1e180e',
    '--bg-surface': '#2a2014',
    '--text-primary': '#f5f0e8',
    '--text-secondary': '#d4c49a',
    '--accent-primary': '#c9a84c',
    '--accent-secondary': '#e8dcc8',
    '--border-color': '#3a2c18',
    '--particle-color': '#c9a84c',
  },
  cute: {
    '--bg-primary': '#0f0a18',
    '--bg-secondary': '#1a1228',
    '--bg-surface': '#251a38',
    '--text-primary': '#fff0f8',
    '--text-secondary': '#f4b8d8',
    '--accent-primary': '#ff8fb1',
    '--accent-secondary': '#7fc8c8',
    '--border-color': '#3a2050',
    '--particle-color': '#ff8fb1',
  },
  dark_glam: {
    '--bg-primary': '#080514',
    '--bg-secondary': '#10092a',
    '--bg-surface': '#180f3a',
    '--text-primary': '#f0ecff',
    '--text-secondary': '#c4b4f0',
    '--accent-primary': '#9b5de5',
    '--accent-secondary': '#f15bb5',
    '--border-color': '#2a1860',
    '--particle-color': '#9b5de5',
  },
  fresh: {
    '--bg-primary': '#080e08',
    '--bg-secondary': '#101a10',
    '--bg-surface': '#182618',
    '--text-primary': '#f0f8f0',
    '--text-secondary': '#b8d4b8',
    '--accent-primary': '#4caf7d',
    '--accent-secondary': '#e8d5a8',
    '--border-color': '#1e3020',
    '--particle-color': '#4caf7d',
  },
  golden_sunset: {
    '--bg-primary': '#120a04',
    '--bg-secondary': '#1e1008',
    '--bg-surface': '#2c1a0c',
    '--text-primary': '#fef3e2',
    '--text-secondary': '#e8c88a',
    '--accent-primary': '#d4a853',
    '--accent-secondary': '#c4714a',
    '--border-color': '#3a2010',
    '--particle-color': '#d4a853',
  },
};

/**
 * Returns a heartfelt, event-appropriate greeting line.
 * Replaces the generic "Happy {label}!" pattern.
 */
export function getGreeting(
  eventType: EventType,
  recipientName: string,
  customLabel?: string | null
): string {
  const name = recipientName.trim();
  switch (eventType) {
    case 'birthday':      return `Happy Birthday, ${name}! 🎂`;
    case 'anniversary':   return `Happy Anniversary! 💍`;
    case 'baby_shower':   return `Congratulations, ${name}! 🍼`;
    case 'valentine':     return `Happy Valentine's Day! 💖`;
    case 'engagement':    return `Congratulations, ${name}! 💎`;
    case 'graduation':    return `Congratulations, ${name}! 🎓`;
    case 'promotion':     return `Congratulations, ${name}! 💼`;
    case 'housewarming':  return `Welcome Home, ${name}! 🏠`;
    case 'just_because':  return `This is for you, ${name}! 🎉`;
    case 'farewell':      return `We'll Miss You, ${name}! 👋`;
    case 'retirement':    return `Happy Retirement, ${name}! 🏖️`;
    case 'get_well_soon': return `Get Well Soon, ${name}! 🌸`;
    case 'new_job':       return `Congrats on the New Role, ${name}! 🚀`;
    case 'custom':
      return customLabel
        ? `${customLabel}, ${name}! ✨`
        : `Celebrating You, ${name}! ✨`;
    default:              return `Celebrating You, ${name}! 🎉`;
  }
}

/**
 * Returns an event-aware teaser line shown on the countdown / waiting screen.
 */
export function getCountdownTeaser(eventType: EventType): string {
  switch (eventType) {
    case 'birthday':      return '🎂 Something sweet is waiting for you...';
    case 'anniversary':   return '💍 A special memory is being unwrapped...';
    case 'baby_shower':   return '🍼 A little surprise is on its way...';
    case 'valentine':     return '💖 Something lovely awaits...';
    case 'engagement':    return '💎 A beautiful surprise is being revealed...';
    case 'graduation':    return '🎓 A proud moment is about to be shared...';
    case 'promotion':     return '🚀 A celebration is on the way...';
    case 'housewarming':  return '🏠 A warm welcome is being prepared...';
    case 'farewell':      return '👋 A heartfelt goodbye is being prepared...';
    case 'retirement':    return '🏖️ A legendary farewell awaits...';
    case 'get_well_soon': return '🌸 Warm healing wishes are on their way...';
    case 'new_job':       return '🚀 A cheer for your next chapter awaits...';
    default:              return '🎁 You have a surprise waiting...';
  }
}

export function getMidnightTonight(): Date {
  const midnight = new Date();
  midnight.setDate(midnight.getDate() + 1);
  midnight.setHours(0, 0, 0, 0);
  return midnight;
}

export function toLocalISOString(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}
