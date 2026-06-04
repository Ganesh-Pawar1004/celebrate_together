'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getAllLocalEvents, deleteEventLocally } from '@/lib/localStore';
import type { CelebrationEvent } from '@/lib/types';
import { EVENT_LABELS } from '@/lib/types';
import { formatScheduledDate, isRevealed } from '@/lib/utils';
import styles from './page.module.css';



export default function DashboardPage() {
  const [events, setEvents] = useState<CelebrationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured) {
        // Demo mode — read from localStorage
        setEvents(getAllLocalEvents());
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setEvents(data);
      setLoading(false);
    }
    load();
  }, []);

  const copyLink = async (ev: CelebrationEvent) => {
    const url = `${window.location.origin}/celebrate/${ev.share_slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(ev.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deactivate = async (id: string) => {
    if (!isSupabaseConfigured) {
      deleteEventLocally(id);
      setEvents((es) => es.filter((e) => e.id !== id));
      return;
    }
    await supabase.from('events').update({ is_active: false }).eq('id', id);
    setEvents((es) => es.filter((e) => e.id !== id));
  };

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>My Celebrations</h1>
            <p className={styles.subtitle}>Manage and track all your shared surprises.</p>
          </div>
          <Link href="/create" className="btn btn--primary">
            + New Celebration
          </Link>
        </header>

        {/* Loading */}
        {loading && (
          <div className={styles.loadingGrid}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={`skeleton ${styles.skeletonCard}`} aria-hidden="true" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && events.length === 0 && (
          <div className={styles.emptyState} role="status">
            <span className={styles.emptyIcon} aria-hidden="true">🎊</span>
            <h2>No celebrations yet</h2>
            <p>Create your first surprise for someone special.</p>
            <Link href="/create" className="btn btn--primary btn--lg">
              Create Your First Celebration
            </Link>
          </div>
        )}

        {/* Event cards */}
        {!loading && events.length > 0 && (
          <ul className={styles.eventGrid} role="list">
            {events.map((ev) => {
              const revealed = isRevealed(ev.scheduled_at);
              const eventInfo = EVENT_LABELS[ev.event_type];
              const celebUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/celebrate/${ev.share_slug}`;

              return (
                <li key={ev.id} className={`card ${styles.eventCard}`}>
                  <div className={styles.cardTop}>
                    <div className={styles.eventEmoji} aria-hidden="true">{eventInfo.emoji}</div>
                    <div className={styles.cardMeta}>
                      <span className={`badge ${revealed ? 'badge--muted' : 'badge--accent'}`}>
                        {revealed ? '✓ Revealed' : '⏳ Scheduled'}
                      </span>
                      <span className={styles.viewCount} aria-label={`${ev.view_count} views`}>
                        👁 {ev.view_count} view{ev.view_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <h2 className={styles.eventTitle}>
                    {eventInfo.label} for <strong>{ev.recipient_name}</strong>
                  </h2>
                  <p className={styles.eventDate}>
                    {revealed ? 'Revealed' : 'Reveals'} {formatScheduledDate(ev.scheduled_at)}
                  </p>
                  <p className={styles.eventTheme}>
                    Theme: {ev.theme.replace('_', ' ')}
                  </p>

                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => copyLink(ev)}
                      aria-label={`Copy link for ${ev.recipient_name}'s celebration`}
                    >
                      {copiedId === ev.id ? '✓ Copied!' : '🔗 Copy Link'}
                    </button>
                    <a
                      href={celebUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn--ghost btn--sm"
                      aria-label={`Preview ${ev.recipient_name}'s celebration`}
                    >
                      👁 Preview
                    </a>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      style={{ color: '#ff6b6b' }}
                      onClick={() => deactivate(ev.id)}
                      aria-label={`Delete ${ev.recipient_name}'s celebration`}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
