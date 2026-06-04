'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getEventBySlug } from '@/lib/localStore';
import type { CelebrationEvent } from '@/lib/types';
import { EVENT_LABELS, THEME_LABELS } from '@/lib/types';
import { getCountdownParts, isRevealed, THEME_TOKENS } from '@/lib/utils';
import { MUSIC_TRACKS } from '@/lib/music';
import MusicPlayer from '@/components/MusicPlayer';
import TypewriterText from '@/components/TypewriterText';
import styles from './page.module.css';

// Dynamic import for confetti (client only)
let fireConfetti: (() => void) | null = null;
if (typeof window !== 'undefined') {
  import('canvas-confetti').then((mod) => {
    const confetti = mod.default;
    fireConfetti = () => {
      const count = 350;
      const defaults = { startVelocity: 30, spread: 360, ticks: 80, zIndex: 999 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
      const fire = (particleRatio: number, opts: object) =>
        confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });

      // Second burst from corners
      setTimeout(() => {
        confetti({
          particleCount: 180,
          angle: 60,
          spread: 80,
          origin: { x: 0, y: 0.8 },
          colors: ['#ff6b9d', '#ffd166', '#e8534a', '#9b5de5'],
        });
        confetti({
          particleCount: 180,
          angle: 120,
          spread: 80,
          origin: { x: 1, y: 0.8 },
          colors: ['#ff6b9d', '#ffd166', '#e8534a', '#9b5de5'],
        });
      }, 350);
    };
  });
}

type PageState = 'loading' | 'waiting' | 'revealed' | 'error';

export default function CelebratePage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<CelebrationEvent | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [reactionSent, setReactionSent] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const confettiFired = useRef(false);

  const REACTION_EMOJIS = ['❤️', '😭', '🥹', '😍', '🎉', '💫', '🫶', '😊'];

  const startCountdown = useCallback((ev: CelebrationEvent) => {
    if (isRevealed(ev.scheduled_at)) {
      setPageState('revealed');
      return;
    }
    setPageState('waiting');
    timerRef.current = setInterval(() => {
      const parts = getCountdownParts(ev.scheduled_at);
      setCountdown(parts);
      if (parts.total <= 0) {
        clearInterval(timerRef.current!);
        setPageState('revealed');
      }
    }, 1000);
  }, []);

  useEffect(() => {
    async function loadEvent() {
      if (!isSupabaseConfigured) {
        const local = getEventBySlug(slug);
        if (!local) {
          setPageState('error');
          return;
        }
        setEvent(local);
        startCountdown(local);
        return;
      }

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('share_slug', slug)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setPageState('error');
        return;
      }

      setEvent(data);
      startCountdown(data);
      await supabase.from('events').update({ view_count: (data.view_count ?? 0) + 1 }).eq('id', data.id);
    }

    loadEvent();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [slug, startCountdown]);

  // Fire confetti on reveal
  useEffect(() => {
    if (pageState === 'revealed' && !confettiFired.current) {
      confettiFired.current = true;
      setTimeout(() => { fireConfetti?.(); }, 300);
      setTimeout(() => { fireConfetti?.(); }, 1400);
    }
  }, [pageState]);

  const sendReaction = async (emoji: string) => {
    setSelectedEmoji(emoji);
    if (event && isSupabaseConfigured) {
      await supabase.from('reactions').insert({ event_id: event.id, emoji });
    }
    setTimeout(() => setReactionSent(true), 600);
  };

  // Apply theme CSS variables
  const themeStyle = event
    ? (Object.fromEntries(
        Object.entries(THEME_TOKENS[event.theme]).map(([k, v]) => [k, v])
      ) as React.CSSProperties)
    : {};

  const eventInfo = event ? EVENT_LABELS[event.event_type] : null;

  // Resolve the actual audio URL to play
  const resolvedMusicUrl = (() => {
    if (!event || !event.music_preset || event.music_preset === 'none') return '';
    if (event.music_preset === 'custom') return event.custom_music_data ?? '';
    const track = MUSIC_TRACKS.find((t) => t.id === event.music_preset);
    return track?.url ?? '';
  })();

  return (
    <div className={styles.page} style={themeStyle} aria-live="polite" aria-atomic="true">
      {/* Animated background particles */}
      {event && pageState !== 'loading' && (
        <div className={styles.bgParticles} aria-hidden="true">
          {Array.from({ length: 20 }).map((_, i) => (
            <span
              key={i}
              className={styles.bgParticle}
              style={{
                left: `${(i * 5 + 2) % 100}%`,
                animationDuration: `${8 + (i % 7) * 2}s`,
                animationDelay: `${(i % 5) * 1.2}s`,
                fontSize: `${0.7 + (i % 4) * 0.3}rem`,
                opacity: 0.4 + (i % 3) * 0.1,
              }}
            >
              {['✨', '💫', '⭐', '🌟', '💖'][i % 5]}
            </span>
          ))}
        </div>
      )}

      {/* ── LOADING ── */}
      {pageState === 'loading' && (
        <div className={styles.stateCenter}>
          <div className={styles.loadingIcon} aria-label="Loading your surprise">🎁</div>
          <p className={styles.loadingText}>Loading your surprise...</p>
        </div>
      )}

      {/* ── ERROR ── */}
      {pageState === 'error' && (
        <div className={styles.stateCenter}>
          <span className={styles.errorIcon} aria-hidden="true">💔</span>
          <h1 className={styles.errorTitle}>Celebration not found</h1>
          <p className={styles.errorDesc}>
            This link may have expired or the celebration was removed. Ask the person who sent it!
          </p>
          <a href="/" className="btn btn--primary btn--lg">Go Home</a>
        </div>
      )}

      {/* ── WAITING / COUNTDOWN ── */}
      {pageState === 'waiting' && event && (
        <div className={styles.waitingSection}>
          <div className={styles.giftPulse} aria-hidden="true">🎁</div>
          <p className={styles.surpriseHint}>You have a surprise waiting...</p>
          <h1 className={styles.forName}>
            For <span className={styles.nameHighlight}>{event.recipient_name}</span>
          </h1>
          <p className={styles.fromName}>
            From <strong>{event.sender_name}</strong> · {eventInfo?.emoji} {eventInfo?.label}
          </p>

          <div className={styles.countdownWrapper} aria-label="Countdown to reveal">
            <div className="countdown-grid">
              {[
                { value: countdown.days, label: 'Days' },
                { value: countdown.hours, label: 'Hours' },
                { value: countdown.minutes, label: 'Minutes' },
                { value: countdown.seconds, label: 'Seconds' },
              ].map(({ value, label }) => (
                <div key={label} className="countdown-unit">
                  <span className="countdown-digit">
                    {String(value).padStart(2, '0')}
                  </span>
                  <span className="countdown-label">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className={styles.waitHint}>
            🌙 Open only when the countdown reaches zero
          </p>
        </div>
      )}

      {/* ── REVEALED ── */}
      {pageState === 'revealed' && event && (
        <div className={styles.revealSection}>
          <div className={styles.revealHeader} aria-hidden="true">
            <span className={styles.revealEmoji}>{eventInfo?.emoji ?? '🎉'}</span>
          </div>

          <div className={styles.revealCard}>
            <p className={styles.revealHappy}>
              Happy {EVENT_LABELS[event.event_type].label}!
            </p>
            <h1 className={styles.revealName}>{event.recipient_name} 🎊</h1>

            {/* Optional photo */}
            {event.photo_url && (() => {
              let firstPhoto = event.photo_url;
              try {
                const parsed = JSON.parse(event.photo_url);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  firstPhoto = parsed[0];
                }
              } catch {}
              if (!firstPhoto) return null;
              return (
                <div className={styles.revealPhotoWrapper}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={firstPhoto}
                    alt={`Special photo from ${event.sender_name}`}
                    className={styles.revealPhoto}
                  />
                </div>
              );
            })()}

            <div className={styles.revealDivider} aria-hidden="true" />

            <blockquote className={styles.revealMessage}>
              <p>
                <TypewriterText
                  text={event.custom_message}
                  speed={24}
                  delay={500}
                />
              </p>
              <footer className={styles.revealFrom}>
                — {event.sender_name} 💖
              </footer>
            </blockquote>
          </div>

          {/* Real-time Live Interactive Celebration Button */}
          <div className={styles.liveCelebrateSection}>
            <a 
              href={`/celebrate/${slug}/live`} 
              className={`btn btn--primary btn--lg ${styles.liveCelebrateBtn}`}
            >
              🎉 Let&apos;s Celebrate the Moment! 🎂
            </a>
          </div>

          {/* Reaction section */}
          {!reactionSent ? (
            <div className={styles.reactionSection} aria-label="Send a reaction">
              <p className={styles.reactionPrompt}>How does this make you feel? 💌</p>
              <div className={styles.emojiGrid} role="group" aria-label="Choose an emoji reaction">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={`${styles.emojiBtn} ${selectedEmoji === emoji ? styles.emojiSelected : ''}`}
                    onClick={() => sendReaction(emoji)}
                    aria-label={`React with ${emoji}`}
                    aria-pressed={selectedEmoji === emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.reactionSent} role="status">
              <span aria-hidden="true">{selectedEmoji}</span>
              <p>Your reaction was sent! 💌</p>
            </div>
          )}

          <a href="/create" className="btn btn--ghost btn--lg" style={{ marginTop: 'var(--space-6)' }}>
            Create Your Own Celebration ✨
          </a>
        </div>
      )}

      {/* Music player — shows "Play Music" button on reveal */}
      {pageState === 'revealed' && resolvedMusicUrl && (
        <MusicPlayer
          trackUrl={resolvedMusicUrl}
          loop
        />
      )}
    </div>
  );
}
