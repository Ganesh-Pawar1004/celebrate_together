'use client';

import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import type { EventType, Theme } from '@/lib/types';
import { EVENT_LABELS, THEME_LABELS } from '@/lib/types';
import { generateSlug, getMidnightTonight, toLocalISOString, THEME_TOKENS } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { saveEventLocally } from '@/lib/localStore';
import { MUSIC_TRACKS, getDefaultTrack } from '@/lib/music';
import styles from './page.module.css';

const STEPS = ['Occasion', 'Personalise', 'Theme & Music', 'Schedule', 'Share'];

interface FormData {
  event_type: EventType;
  recipient_name: string;
  sender_name: string;
  custom_message: string;
  theme: Theme;
  music_preset: string;
  /** base64 data URI of a user-uploaded audio file (when music_preset === 'custom') */
  custom_music_data: string | null;
  photo_url: string | null; // Stores JSON array of base64 images
  scheduled_at: string;
  cake_flavor: 'chocolate' | 'vanilla' | 'strawberry' | 'red-velvet';
}

const defaultForm: FormData = {
  event_type: 'birthday',
  recipient_name: '',
  sender_name: '',
  custom_message: '',
  theme: 'joyful',
  music_preset: 'happy_upbeat',
  custom_music_data: null,
  photo_url: null,
  scheduled_at: toLocalISOString(getMidnightTonight()),
  cake_flavor: 'chocolate',
};

function CreatePageInner() {
  const params = useSearchParams();
  const initialType = (params.get('type') as EventType) ?? 'birthday';

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({ ...defaultForm, event_type: initialType });
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const [copiedWish, setCopiedWish] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const photos: string[] = (() => {
    if (!form.photo_url) return [];
    try {
      const parsed = JSON.parse(form.photo_url);
      return Array.isArray(parsed) ? parsed : [form.photo_url];
    } catch {
      return [form.photo_url];
    }
  })();

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setPhotoError('');
    const newFiles = Array.from(files).slice(0, 4 - photos.length);
    if (newFiles.length === 0) {
      setPhotoError('You can upload up to 4 photos.');
      return;
    }

    const base64Promises = newFiles.map((file) => {
      return new Promise<string>((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
          reject(new Error('Please upload an image file (JPG, PNG, GIF, WebP).'));
          return;
        }
        if (file.size > 900 * 1024) {
          reject(new Error('File is too large. Max size 900 KB.'));
          return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const maxW = 1000;
              const scale = Math.min(1, maxW / img.width);
              canvas.width = img.width * scale;
              canvas.height = img.height * scale;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
              resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.src = event.target?.result as string;
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
    });

    try {
      const base64s = await Promise.all(base64Promises);
      const updated = [...photos, ...base64s].slice(0, 4);
      update('photo_url', JSON.stringify(updated));
    } catch (err: any) {
      setPhotoError(err.message ?? 'Could not process some image files.');
    }
  };

  const removePhoto = (idx: number) => {
    const updated = photos.filter((_, i) => i !== idx);
    update('photo_url', updated.length > 0 ? JSON.stringify(updated) : null);
  };

  const update = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  const validateStep = (): string => {
    if (step === 1) {
      if (!form.recipient_name.trim()) return 'Please enter the recipient\'s name.';
      if (!form.sender_name.trim()) return 'Please enter your name.';
      if (form.custom_message.trim().length < 10) return 'Please write at least 10 characters for your wish.';
    }
    if (step === 3) {
      if (new Date(form.scheduled_at) <= new Date()) return 'Please choose a future date and time.';
    }
    return '';
  };

  const next = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prev = () => { setError(''); setStep((s) => Math.max(s - 1, 0)); };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    const newSlug = generateSlug();

    const basePayload = {
      id: newSlug,
      share_slug: newSlug,
      creator_id: null,
      event_type: form.event_type,
      recipient_name: form.recipient_name,
      sender_name: form.sender_name,
      custom_message: form.custom_message,
      theme: form.theme,
      music_preset: form.music_preset,
      custom_music_data: form.custom_music_data,
      photo_url: form.photo_url,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      is_active: true,
      view_count: 0,
      created_at: new Date().toISOString(),
    };

    const eventPayload = {
      ...basePayload,
      cake_flavor: form.cake_flavor,
    };

    if (!isSupabaseConfigured) {
      // Demo mode — persist to localStorage so the celebrate page can read it
      saveEventLocally(eventPayload);
      setSlug(newSlug);
      setStep(4);
      setLoading(false);
      return;
    }

    const { error: dbErr } = await supabase.from('events').insert(eventPayload);
    if (dbErr) {
      console.warn('Insert with extra columns failed, falling back to base insert:', dbErr);
      const { error: retryErr } = await supabase.from('events').insert(basePayload);
      if (retryErr) {
        setError('Could not save your celebration. Please try again.');
        setLoading(false);
        return;
      }
    }

    setSlug(newSlug);
    setStep(4);
    setLoading(false);
  };

  const celebrateUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/celebrate/${slug}`
    : `/celebrate/${slug}`;

  const wishUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/celebrate/${slug}/wish`
    : `/celebrate/${slug}/wish`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(celebrateUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const copyWishLink = async () => {
    await navigator.clipboard.writeText(wishUrl);
    setCopiedWish(true);
    setTimeout(() => setCopiedWish(false), 2500);
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `🎁 I have a surprise for you! Open this link at the right moment: ${celebrateUrl}`
  )}`;

  const themeTokens = THEME_TOKENS[form.theme];

  return (
    <div className={styles.page}>
      <div className={`container container--narrow ${styles.inner}`}>
        {/* Step bar */}
        {step < 4 && (
          <nav className="steps-bar" aria-label="Creation steps">
            {STEPS.slice(0, 4).map((label, i) => (
              <div key={label} className="step-item">
                <div
                  className={`step-circle ${
                    i < step ? 'step-circle--done' : i === step ? 'step-circle--active' : 'step-circle--pending'
                  }`}
                  aria-current={i === step ? 'step' : undefined}
                >
                  {i < step ? '✓' : i + 1}
                </div>
                {i < STEPS.length - 2 && (
                  <div className={`step-line ${i < step ? 'step-line--done' : ''}`} />
                )}
              </div>
            ))}
          </nav>
        )}

        {/* ─── STEP 0: Choose Occasion ─── */}
        {step === 0 && (
          <div className={styles.stepSection}>
            <h1 className={styles.stepTitle}>What are you celebrating?</h1>
            <p className={styles.stepDesc}>Choose the occasion for this special surprise.</p>
            <ul className={styles.occasionGrid} role="list">
              {(Object.entries(EVENT_LABELS) as [EventType, { label: string; emoji: string }][]).map(([key, { label, emoji }]) => (
                <li key={key}>
                  <button
                    type="button"
                    className={`${styles.occasionBtn} ${form.event_type === key ? styles.selected : ''}`}
                    onClick={() => { update('event_type', key); next(); }}
                    aria-pressed={form.event_type === key}
                  >
                    <span className={styles.occasionEmoji}>{emoji}</span>
                    <span className={styles.occasionLabel}>{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ─── STEP 1: Personalise ─── */}
        {step === 1 && (
          <div className={styles.stepSection}>
            <h1 className={styles.stepTitle}>Personalise the celebration</h1>
            <p className={styles.stepDesc}>These details will appear in the surprise reveal.</p>
            <div className={styles.formStack}>
              <div className={styles.nameRow}>
                <div className="form-group">
                  <label className="form-label" htmlFor="recipient-name">
                    Recipient&apos;s name <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="recipient-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Priya"
                    value={form.recipient_name}
                    onChange={(e) => update('recipient_name', e.target.value)}
                    maxLength={60}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="sender-name">
                    Your name <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="sender-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Rahul"
                    value={form.sender_name}
                    onChange={(e) => update('sender_name', e.target.value)}
                    maxLength={60}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="custom-message">
                  Your heartfelt message <span aria-hidden="true">*</span>
                </label>
                <textarea
                  id="custom-message"
                  className="form-textarea"
                  placeholder="Write your personal wish here... Make it from the heart! ❤️"
                  value={form.custom_message}
                  onChange={(e) => update('custom_message', e.target.value)}
                  rows={5}
                  maxLength={1000}
                  required
                />
                <span className="form-hint">
                  {form.custom_message.length}/1000 characters
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Add photos (Max 4) <span className={styles.optionalTag}>optional</span></label>
                <span className="form-hint" style={{ marginTop: 0 }}>
                  These will float in a Polaroid slideshow during the celebration.
                </span>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {photos.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={`Upload ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          backgroundColor: '#ff6b6b',
                          color: '#fff',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 'bold',
                        }}
                        aria-label="Remove photo"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  
                  {photos.length < 4 && (
                    <label style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '8px',
                      border: '2px dashed var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '1.5rem',
                      color: 'var(--text-secondary)',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)'
                    }}>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handlePhotoUpload}
                      />
                      +
                    </label>
                  )}
                </div>
                {photoError && <p className="form-error" style={{ marginTop: '0.25rem' }}>{photoError}</p>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cake-flavor">
                  Celebration Cake Flavor
                </label>
                <select
                  id="cake-flavor"
                  className="form-select"
                  value={form.cake_flavor}
                  onChange={(e) => update('cake_flavor', e.target.value as any)}
                >
                  <option value="chocolate">Chocolate 🍫</option>
                  <option value="vanilla">Vanilla 🍦</option>
                  <option value="strawberry">Strawberry 🍓</option>
                  <option value="red-velvet">Red Velvet 🍰</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Theme & Music ─── */}
        {step === 2 && (
          <div className={styles.stepSection}>
            <h1 className={styles.stepTitle}>Theme &amp; Music</h1>
            <p className={styles.stepDesc}>Choose the visual style and background music for the reveal moment.</p>

            <h2 className={styles.subHeading}>Visual Theme</h2>
            <div className="theme-grid">
              {(Object.entries(THEME_LABELS) as [Theme, { label: string; description: string }][]).map(([key, { label, description }]) => {
                const tokens = THEME_TOKENS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    className={`theme-card ${form.theme === key ? 'theme-card--selected' : ''}`}
                    style={{ background: tokens['--bg-secondary'] }}
                    onClick={() => update('theme', key)}
                    aria-pressed={form.theme === key}
                  >
                    <div
                      className="theme-card__swatch"
                      style={{
                        background: `linear-gradient(135deg, ${tokens['--accent-primary']}, ${tokens['--accent-secondary']})`,
                      }}
                    />
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ fontWeight: 700, color: tokens['--text-primary'], marginBottom: 4, fontSize: 'var(--text-sm)' }}>
                        {label}
                      </p>
                      <p style={{ fontSize: 'var(--text-xs)', color: tokens['--text-secondary'], margin: 0 }}>
                        {description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <h2 className={styles.subHeading} style={{ marginTop: 'var(--space-8)' }}>Background Music</h2>
            <p className={styles.stepDesc}>
              Plays softly when your loved one opens the surprise.
            </p>
            <ul className={styles.musicGrid} role="list">
              {MUSIC_TRACKS.map((track) => (
                <li key={track.id}>
                  <button
                    type="button"
                    className={`${styles.musicCard} ${form.music_preset === track.id ? styles.musicSelected : ''}`}
                    onClick={() => {
                      update('music_preset', track.id);
                      if (track.id !== 'custom') update('custom_music_data', null);
                    }}
                    aria-pressed={form.music_preset === track.id}
                  >
                    <span className={styles.musicEmoji} aria-hidden="true">{track.emoji}</span>
                    <span className={styles.musicLabel}>{track.label}</span>
                    {form.music_preset === track.id && (
                      <span className={styles.musicCheck} aria-hidden="true">✓</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>

            {form.music_preset === 'custom' && (
              <div className={styles.customMusicUpload}>
                <label className={styles.customMusicLabel} htmlFor="custom-music-input">
                  <span aria-hidden="true">🎵</span>
                  {form.custom_music_data
                    ? 'Music uploaded! Click to change.'
                    : 'Choose an audio file (MP3, M4A, OGG · max 8 MB)'}
                  <input
                    id="custom-music-input"
                    type="file"
                    accept="audio/*"
                    className="sr-only"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 8 * 1024 * 1024) {
                        alert('File is too large. Please choose one under 8 MB.');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        update('custom_music_data', ev.target?.result as string ?? null);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                {form.custom_music_data && (
                  <div className={styles.audioPreview}>
                    <span aria-hidden="true">✅</span>
                    <audio
                      controls
                      src={form.custom_music_data}
                      className={styles.audioPreviewPlayer}
                      aria-label="Preview your uploaded music"
                    />
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => update('custom_music_data', null)}
                      aria-label="Remove custom music"
                    >
                      🗑
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}


        {/* ─── STEP 3: Schedule ─── */}
        {step === 3 && (
          <div className={styles.stepSection}>
            <h1 className={styles.stepTitle}>When is the reveal?</h1>
            <p className={styles.stepDesc}>
              Set the exact date and time the countdown will reach zero and the surprise is revealed.
              We default to midnight tonight — perfect for birthday surprises! 🌙
            </p>
            <div className={styles.formStack}>
              <div className="form-group">
                <label className="form-label" htmlFor="scheduled-at">
                  Reveal date &amp; time
                </label>
                <input
                  id="scheduled-at"
                  type="datetime-local"
                  className="form-input"
                  value={form.scheduled_at}
                  onChange={(e) => update('scheduled_at', e.target.value)}
                  min={toLocalISOString(new Date(Date.now() + 60 * 1000))}
                />
                <span className="form-hint">
                  Time is in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                </span>
              </div>

              <div className={styles.schedulePresets}>
                <p className="form-label">Quick presets</p>
                <div className={styles.presetBtns}>
                  {[
                    { label: '🌙 Tonight midnight', fn: () => getMidnightTonight() },
                    { label: '🌙 Tomorrow midnight', fn: () => { const d = getMidnightTonight(); d.setDate(d.getDate() + 1); return d; } },
                    { label: '🌅 Tonight 9 PM', fn: () => { const d = new Date(); d.setHours(21, 0, 0, 0); if (d <= new Date()) d.setDate(d.getDate() + 1); return d; } },
                  ].map(({ label, fn }) => (
                    <button
                      key={label}
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => update('scheduled_at', toLocalISOString(fn()))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 4: Share ─── */}
        {step === 4 && slug && (
          <div className={styles.shareSection}>
            <div className={styles.shareSuccess}>
              <div className={styles.successIcon} aria-hidden="true">🎊</div>
              <h1 className={styles.stepTitle}>Your celebration is ready!</h1>
              <p className={styles.stepDesc}>
                Share this secret link with <strong>{form.recipient_name}</strong>. Tell them to open it only when the time is right!
              </p>
            </div>

            <div className={styles.linkBox}>
              <span className={styles.linkText}>{celebrateUrl}</span>
              <button
                type="button"
                className={`btn btn--primary btn--sm ${styles.copyBtn}`}
                onClick={copyLink}
                aria-label="Copy celebration link"
              >
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>

            <div className={styles.shareActions}>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--primary"
                aria-label="Share via WhatsApp"
              >
                💬 Share on WhatsApp
              </a>
              <button type="button" className="btn btn--ghost" onClick={copyLink}>
                🔗 Copy Link
              </button>
            </div>

            <div className={styles.shareNote}>
              <p>🔒 The surprise is safe — the reveal only happens at the scheduled time.</p>
              <p>📊 Track views and reactions in your <a href="/dashboard" style={{ color: 'var(--accent)' }}>Dashboard</a>.</p>
            </div>

            <div style={{ marginTop: '2.5rem', borderTop: '1.5px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: '0.5rem', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>💌 Collect wishes from friends</h3>
              <p className={styles.stepDesc} style={{ marginBottom: '1.25rem' }}>
                Send this wish-collection link to friends. They can leave wishes that float up in real-time during the live celebration!
              </p>
              
              <div className={styles.linkBox}>
                <span className={styles.linkText}>{wishUrl}</span>
                <button
                  type="button"
                  className={`btn btn--primary btn--sm ${styles.copyBtn}`}
                  onClick={copyWishLink}
                  aria-label="Copy wish collection link"
                >
                  {copiedWish ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className={styles.errorMsg} role="alert" aria-live="polite">{error}</p>
        )}

        {/* Nav buttons */}
        {step < 4 && (
          <div className={styles.navBtns}>
            {step > 0 && (
              <button type="button" className="btn btn--ghost" onClick={prev}>
                ← Back
              </button>
            )}
            {step < 3 && step !== 0 && (
              <button type="button" className="btn btn--primary" onClick={next}>
                Continue →
              </button>
            )}
            {step === 3 && (
              <button
                type="button"
                className="btn btn--primary btn--lg"
                onClick={handleSubmit}
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? 'Creating...' : '✨ Create Celebration'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="container" style={{ paddingTop: '8rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>}>
      <CreatePageInner />
    </Suspense>
  );
}
