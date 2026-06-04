'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getEventBySlug } from '@/lib/localStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { addWish } from '@/lib/wishesStore';
import type { CelebrationEvent } from '@/lib/types';
import { EVENT_LABELS } from '@/lib/types';
import { THEME_TOKENS } from '@/lib/utils';
import styles from './page.module.css';

export default function WishPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<CelebrationEvent | null>(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadEvent() {
      if (!isSupabaseConfigured) {
        const local = getEventBySlug(slug);
        setEvent(local);
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('events')
          .select('*')
          .eq('share_slug', slug)
          .eq('is_active', true)
          .single();

        setEvent(data);
      } catch (err) {
        console.error('Error loading event for wishes page:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    
    setSubmitting(true);
    setError('');

    try {
      await addWish(event.id, name.trim(), message.trim());
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError('Could not submit your wish. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.stateCenter}>
          <div className={styles.loadingIcon}>🎁</div>
          <p className={styles.loadingText}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className={styles.page}>
        <div className={styles.stateCenter}>
          <span className={styles.errorIcon}>💔</span>
          <h1 className={styles.errorTitle}>Surprise not found</h1>
          <p className={styles.errorDesc}>This link may have expired or is incorrect.</p>
          <a href="/" className="btn btn--primary">Go Home</a>
        </div>
      </div>
    );
  }

  const themeStyle = Object.fromEntries(
    Object.entries(THEME_TOKENS[event.theme]).map(([k, v]) => [k, v])
  ) as React.CSSProperties;

  const eventInfo = EVENT_LABELS[event.event_type];

  if (submitted) {
    return (
      <div className={styles.page} style={themeStyle}>
        <div className={styles.formCard} style={{ textAlign: 'center' }}>
          <h1 className={styles.title} style={{ color: 'var(--accent-primary)' }}>Thank You! 💌</h1>
          <p className={styles.desc} style={{ marginTop: '1rem', marginBottom: '2rem' }}>
            Your wishes have been added to the celebration for <strong>{event.recipient_name}</strong>!
          </p>
          <div style={{ fontSize: '4.5rem', animation: 'bounce 2s infinite' }}>💌</div>
          <p className={styles.hint} style={{ marginTop: '2rem' }}>
            They will see your note float up in real-time during the event!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page} style={themeStyle}>
      <div className={styles.formCard}>
        <div className={styles.header}>
          <span className={styles.eventEmoji}>{eventInfo?.emoji ?? '🎉'}</span>
          <h1 className={styles.title}>Send Your Wishes</h1>
          <p className={styles.desc}>
            Leave a message for <strong>{event.recipient_name}</strong> to make their day special!
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="wish-name">Your Name</label>
            <input
              id="wish-name"
              type="text"
              required
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah"
              maxLength={50}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="wish-message">Your Message</label>
            <textarea
              id="wish-message"
              required
              className="form-textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a sweet wish, funny memory, or supportive blessing..."
              maxLength={500}
              rows={4}
              disabled={submitting}
            />
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button
            type="submit"
            className="btn btn--primary btn--lg"
            style={{ width: '100%', marginTop: 'var(--space-2)' }}
            disabled={submitting}
          >
            {submitting ? 'Sending...' : '💌 Send Wishes'}
          </button>
        </form>
      </div>
    </div>
  );
}
