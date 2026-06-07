'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { Play, Pause, Search, Loader2 } from 'lucide-react';
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
  const [uploadingMusic, setUploadingMusic] = useState(false);
  const [previewingTrack, setPreviewingTrack] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Online library search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [fetchingTrackId, setFetchingTrackId] = useState<string | null>(null);
  const [selectedSearchTrack, setSelectedSearchTrack] = useState<any | null>(null);

  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
    };
  }, []);

  const togglePresetPreview = (trackId: string, trackUrl: string) => {
    if (previewingTrack === trackId) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setPreviewingTrack(null);
    } else {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      const audio = new Audio(trackUrl);
      audio.volume = 0.45;
      audio.onended = () => setPreviewingTrack(null);
      previewAudioRef.current = audio;
      audio.play().catch((err) => console.warn('Preview play failed:', err));
      setPreviewingTrack(trackId);
    }
  };

  const handleMusicSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchResults([]);
    try {
      const q = encodeURIComponent(searchQuery.trim());
      const res = await fetch(
        `https://archive.org/advancedsearch.php?q=mediatype:audio+AND+subject:(royalty+free+background+music)+AND+(title:(${q})+OR+creator:(${q})+OR+description:(${q}))+AND+format:MP3&fl[]=identifier,title,creator&output=json&rows=15`
      );
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      const docs = data.response?.docs || [];
      setSearchResults(docs);
    } catch (err) {
      console.error('Music search error:', err);
      alert('Failed to search music. Please check your internet connection and try again.');
    } finally {
      setSearching(false);
    }
  };

  const toggleOnlinePreview = async (item: any) => {
    if (previewingTrack === item.identifier) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setPreviewingTrack(null);
      return;
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }

    setFetchingTrackId(item.identifier);
    try {
      let fileUrl = item.fileUrl;
      if (!fileUrl) {
        const res = await fetch(`https://archive.org/metadata/${item.identifier}`);
        if (!res.ok) throw new Error('Failed to fetch track details.');
        const data = await res.json();

        const mp3File = data.files?.find((f: any) =>
          f.name.toLowerCase().endsWith('.mp3') ||
          f.format?.toLowerCase().includes('mp3')
        );

        if (!mp3File) throw new Error('No streamable MP3 track found for this item.');

        fileUrl = `https://archive.org/download/${item.identifier}/${encodeURIComponent(mp3File.name)}`;
        item.fileUrl = fileUrl;
      }

      const audio = new Audio(fileUrl);
      audio.volume = 0.45;
      audio.onended = () => setPreviewingTrack(null);
      previewAudioRef.current = audio;
      await audio.play();
      setPreviewingTrack(item.identifier);
    } catch (err: any) {
      console.warn('Online preview failed:', err);
      alert(err.message || 'Could not load preview for this track.');
    } finally {
      setFetchingTrackId(null);
    }
  };

  const selectSearchTrack = async (item: any) => {
    setFetchingTrackId(item.identifier);
    try {
      let fileUrl = item.fileUrl;
      if (!fileUrl) {
        const res = await fetch(`https://archive.org/metadata/${item.identifier}`);
        if (!res.ok) throw new Error('Failed to fetch track details.');
        const data = await res.json();

        const mp3File = data.files?.find((f: any) =>
          f.name.toLowerCase().endsWith('.mp3') ||
          f.format?.toLowerCase().includes('mp3')
        );

        if (!mp3File) throw new Error('No streamable MP3 track found for this item.');

        fileUrl = `https://archive.org/download/${item.identifier}/${encodeURIComponent(mp3File.name)}`;
        item.fileUrl = fileUrl;
      }

      setSelectedSearchTrack(item);
      update('custom_music_data', fileUrl);

      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        setPreviewingTrack(null);
      }
    } catch (err: any) {
      console.warn('Track selection failed:', err);
      alert(err.message || 'Could not select this track.');
    } finally {
      setFetchingTrackId(null);
    }
  };

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
      music_preset: form.music_preset === 'search' ? 'custom' : form.music_preset,
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
                  className={`step-circle ${i < step ? 'step-circle--done' : i === step ? 'step-circle--active' : 'step-circle--pending'
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
                    placeholder="e.g. Ganesh"
                    value={form.recipient_name}
                    onChange={(e) => update('recipient_name', e.target.value)}
                    maxLength={60}
                    required
                  />
                  <span className="form-hint" style={{ textAlign: 'right', display: 'block' }}>
                    {form.recipient_name.length} / 60 characters
                  </span>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="sender-name">
                    Your name <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="sender-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Durgaa"
                    value={form.sender_name}
                    onChange={(e) => update('sender_name', e.target.value)}
                    maxLength={60}
                    required
                  />
                  <span className="form-hint" style={{ textAlign: 'right', display: 'block' }}>
                    {form.sender_name.length} / 60 characters
                  </span>
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
                <li key={track.id} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className={`${styles.musicCard} ${form.music_preset === track.id ? styles.musicSelected : ''}`}
                    onClick={() => {
                      update('music_preset', track.id);
                      if (track.id !== 'custom' && track.id !== 'search') {
                        update('custom_music_data', null);
                        setSelectedSearchTrack(null);
                      }
                      // Pause preview if selecting another card
                      if (previewAudioRef.current) {
                        previewAudioRef.current.pause();
                        setPreviewingTrack(null);
                      }
                    }}
                    style={{ paddingRight: track.url ? '3.5rem' : '1rem' }}
                    aria-pressed={form.music_preset === track.id}
                  >
                    <span className={styles.musicEmoji} aria-hidden="true">{track.emoji}</span>
                    <span className={styles.musicLabel}>{track.label}</span>
                    {form.music_preset === track.id && (
                      <span className={styles.musicCheck} aria-hidden="true" style={{ marginRight: track.url ? '1.5rem' : '0' }}>✓</span>
                    )}
                  </button>

                  {/* Preview Play/Pause button */}
                  {track.url && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePresetPreview(track.id, track.url);
                      }}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: previewingTrack === track.id ? 'var(--accent)' : 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'background var(--transition-fast), transform var(--transition-fast)',
                        zIndex: 5,
                      }}
                      title={previewingTrack === track.id ? 'Pause Preview' : 'Listen Preview'}
                    >
                      {previewingTrack === track.id ? <Pause size={10} fill="white" /> : <Play size={10} fill="white" style={{ marginLeft: 1 }} />}
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {form.music_preset === 'custom' && (
              <div className={styles.customMusicUpload}>
                <label className={styles.customMusicLabel} htmlFor="custom-music-input" style={{ cursor: uploadingMusic ? 'not-allowed' : 'pointer', opacity: uploadingMusic ? 0.6 : 1 }}>
                  <span aria-hidden="true">🎵</span>
                  {uploadingMusic
                    ? 'Processing & compressing audio (mono WAV)...'
                    : form.custom_music_data
                      ? 'Music uploaded! Click to change.'
                      : 'Choose an audio file (MP3, M4A, OGG · auto-trimmed to 1.5 min)'}
                  <input
                    id="custom-music-input"
                    type="file"
                    accept="audio/*"
                    className="sr-only"
                    disabled={uploadingMusic}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      setUploadingMusic(true);
                      try {
                        // Compress & Trim to 90 seconds Mono WAV
                        const compressedBlob = await compressAudioFile(file);
                        const compressedFile = new File([compressedBlob], 'music.wav', { type: 'audio/wav' });

                        if (isSupabaseConfigured) {
                          const fileExt = 'wav';
                          const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
                          const { data, error: uploadErr } = await supabase.storage
                            .from('celebration-music')
                            .upload(fileName, compressedFile);

                          if (uploadErr) {
                            throw new Error('Upload failed: ' + uploadErr.message);
                          }

                          const { data: { publicUrl } } = supabase.storage
                            .from('celebration-music')
                            .getPublicUrl(fileName);

                          update('custom_music_data', publicUrl);
                        } else {
                          // Demo fallback: convert compressed file to base64
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            update('custom_music_data', ev.target?.result as string ?? null);
                          };
                          reader.readAsDataURL(compressedFile);
                        }
                      } catch (err: any) {
                        console.error('Audio compression failed:', err);
                        alert(err.message || 'Could not process audio. Please ensure it is a valid audio file.');
                      } finally {
                        setUploadingMusic(false);
                      }
                    }}
                  />
                </label>
                {form.custom_music_data && !uploadingMusic && (
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

            {form.music_preset === 'search' && (
              <div className={styles.customMusicUpload} style={{ marginTop: 'var(--space-4)' }}>
                {/* Search Bar */}
                <form onSubmit={handleMusicSearch} style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search background music (e.g. happy, upbeat, piano)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={searching || !searchQuery.trim()}
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '0 1.25rem' }}
                  >
                    {searching ? (
                      <Loader2 size={16} className={styles.spinner} />
                    ) : (
                      <Search size={16} />
                    )}
                    Search
                  </button>
                </form>

                {/* Selected Track Banner */}
                {form.custom_music_data && (
                  <div className={styles.audioPreview} style={{ borderColor: 'var(--accent)', background: 'rgba(232, 83, 74, 0.04)' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Selected: {selectedSearchTrack ? selectedSearchTrack.title : 'Online Track'}
                      </p>
                      {selectedSearchTrack?.creator && (
                        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                          Artist: {selectedSearchTrack.creator}
                        </p>
                      )}
                    </div>
                    <audio
                      controls
                      src={form.custom_music_data}
                      className={styles.audioPreviewPlayer}
                      aria-label="Preview your selected track"
                    />
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => {
                        update('custom_music_data', null);
                        setSelectedSearchTrack(null);
                      }}
                      aria-label="Remove selected track"
                    >
                      🗑
                    </button>
                  </div>
                )}

                {/* Results List */}
                {searching && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-8) 0', color: 'var(--text-muted)' }}>
                    <Loader2 size={28} className={styles.spinner} />
                    <p style={{ fontSize: 'var(--text-sm)', margin: 0 }}>Searching free library...</p>
                  </div>
                )}

                {!searching && searchResults.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: '320px', overflowY: 'auto', paddingRight: 'var(--space-2)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-2)', background: 'rgba(0, 0, 0, 0.1)' }}>
                    {searchResults.map((item) => {
                      const isSelected = form.custom_music_data === item.fileUrl || selectedSearchTrack?.identifier === item.identifier;
                      const isPreviewing = previewingTrack === item.identifier;
                      const isFetching = fetchingTrackId === item.identifier;

                      return (
                        <div
                          key={item.identifier}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                            padding: 'var(--space-3) var(--space-4)',
                            background: isSelected ? 'rgba(232, 83, 74, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                            border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--surface-border)'}`,
                            borderRadius: 'var(--radius-md)',
                            transition: 'background-color var(--transition-fast)'
                          }}
                        >
                          <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>🎵</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.title || 'Untitled Track'}
                            </p>
                            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.creator || 'Unknown Creator'}
                            </p>
                          </div>

                          {/* Play/Pause Preview Button */}
                          <button
                            type="button"
                            onClick={() => toggleOnlinePreview(item)}
                            disabled={isFetching}
                            style={{
                              background: isPreviewing ? 'var(--accent)' : 'rgba(255, 255, 255, 0.1)',
                              border: 'none',
                              borderRadius: '50%',
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                            title={isPreviewing ? 'Pause Preview' : 'Listen Preview'}
                          >
                            {isFetching ? (
                              <Loader2 size={12} className={styles.spinner} />
                            ) : isPreviewing ? (
                              <Pause size={12} fill="white" />
                            ) : (
                              <Play size={12} fill="white" style={{ marginLeft: 1 }} />
                            )}
                          </button>

                          {/* Select Button */}
                          <button
                            type="button"
                            onClick={() => selectSearchTrack(item)}
                            disabled={isFetching}
                            className={`btn ${isSelected ? 'btn--primary' : 'btn--ghost'} btn--sm`}
                            style={{ flexShrink: 0 }}
                          >
                            {isSelected ? '✓ Selected' : 'Select'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!searching && searchQuery && searchResults.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)', margin: 'var(--space-4) 0' }}>
                    No tracks found. Try searching for something else like &quot;party&quot;, &quot;piano&quot;, or &quot;ambient&quot;.
                  </p>
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
              <p>📊 Track views and reactions in your <Link href="/dashboard" style={{ color: 'var(--accent)' }}>Dashboard</Link>.</p>
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

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem', padding: '1.25rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0, textAlign: 'center', fontWeight: 500 }}>📲 Or have friends scan this QR Code to submit wishes:</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(wishUrl)}`}
                  alt="Wish submission QR Code"
                  style={{ width: '130px', height: '130px', borderRadius: 'var(--radius-sm)', border: '4px solid white', boxShadow: 'var(--shadow-md)' }}
                />
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

/** Downsamples and trims audio to max 90 seconds Mono 16-bit WAV */
async function compressAudioFile(file: File): Promise<Blob> {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await file.arrayBuffer();
  const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  // Cap at 90 seconds (1m 30s)
  const maxDuration = Math.min(decodedBuffer.duration, 90);
  const sampleRate = 22050; // downsample to 22.05kHz
  const numChannels = 1; // mono
  const length = maxDuration * sampleRate;

  const offlineCtx = new OfflineAudioContext(numChannels, length, sampleRate);

  const sourceNode = offlineCtx.createBufferSource();
  sourceNode.buffer = decodedBuffer;
  sourceNode.connect(offlineCtx.destination);
  sourceNode.start(0);

  const renderedBuffer = await offlineCtx.startRendering();
  audioCtx.close();

  return bufferToWav(renderedBuffer);
}

function bufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // raw PCM
  const bitDepth = 16;
  const result = buffer.getChannelData(0);
  const bufferLength = result.length * 2;
  const wavBuffer = new ArrayBuffer(44 + bufferLength);
  const view = new DataView(wavBuffer);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
    for (let i = 0; i < input.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  };

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + bufferLength, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numOfChan, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numOfChan * (bitDepth / 8), true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, bufferLength, true);

  // Write PCM audio samples
  floatTo16BitPCM(view, 44, result);

  return new Blob([view], { type: 'audio/wav' });
}
