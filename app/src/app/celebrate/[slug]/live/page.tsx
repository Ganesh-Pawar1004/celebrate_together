'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { getEventBySlug } from '@/lib/localStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { MUSIC_TRACKS } from '@/lib/music';
import MusicPlayer from '@/components/MusicPlayer';
import { LiveCakeDisplay } from '@/components/LiveCakeDisplay';
import { LiveImageCarousel } from '@/components/LiveImageCarousel';
import { LiveFloatingWishes } from '@/components/LiveFloatingWishes';
import { LiveWishesWall } from '@/components/LiveWishesWall';
import type { CelebrationEvent } from '@/lib/types';
import { THEME_TOKENS } from '@/lib/utils';
import { Home, Share2, Clipboard, ArrowRight, QrCode } from 'lucide-react';
import styles from './page.module.css';

type Step = 'intro' | 'cake' | 'party';

export default function LiveCelebrationPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<CelebrationEvent | null>(null);
  const [step, setStep] = useState<Step>('intro');
  const [loading, setLoading] = useState(true);
  const [copiedWish, setCopiedWish] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; x: number; delay: number; duration: number }[]>([]);

  // Load Event
  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured) {
        const local = getEventBySlug(slug);
        setEvent(local);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('share_slug', slug)
          .eq('is_active', true)
          .single();

        if (!error && data) {
          setEvent(data);
        }
      } catch (err) {
        console.error('Error loading event for live page:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  // Generate dynamic emojis based on occasion
  useEffect(() => {
    if (!event) return;

    const getEmojisByOccasion = (type: string) => {
      switch (type) {
        case 'birthday':
          return ['🎈', '🎉', '🎁', '🎂', '✨', '🍰', '🕯️'];
        case 'baby_shower':
          return ['🍼', '👶', '🧸', '💖', '✨', '🎈', '👼'];
        case 'anniversary':
        case 'valentine':
        case 'engagement':
          return ['❤️', '💖', '💍', '🥂', '🌹', '✨', '🫶'];
        case 'graduation':
          return ['🎓', '📜', '🌟', '✨', '🎉', '🎈'];
        case 'promotion':
          return ['💼', '📈', '🚀', '✨', '🎉', '👏'];
        case 'housewarming':
          return ['🏠', '🔑', '🏡', '✨', '🎉', '🥂'];
        case 'farewell':
        case 'retirement':
          return ['✨', '🍂', '🍁', '🍃', '🌟', '🌅'];
        case 'get_well_soon':
          return ['🌸', '🌺', '🌷', '✨', '💖', '🌼'];
        default:
          return ['✨', '🎉', '💫', '🎈', '💖', '🌟'];
      }
    };

    const emojiSet = getEmojisByOccasion(event.event_type);
    const items = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      emoji: emojiSet[Math.floor(Math.random() * emojiSet.length)],
      x: Math.random() * 95, // 0 to 95vw
      duration: 12 + Math.random() * 12, // 12 to 24s
      delay: Math.random() * 10,
    }));

    setFloatingEmojis(items);
  }, [event]);

  // Trigger grand confetti burst on entering the Party step
  useEffect(() => {
    if (step === 'party') {
      const duration = 10 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 99 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        const particleCount = 45 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#ff6b9d', '#ffd166', '#ff6b35', '#9b5de5']
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#ff6b9d', '#ffd166', '#ff6b35', '#9b5de5']
        });
      }, 300);

      return () => clearInterval(interval);
    }
  }, [step]);

  const wishUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/celebrate/${slug}/wish`
    : `/celebrate/${slug}/wish`;

  const liveUrl = typeof window !== 'undefined' ? window.location.href : '';

  const copyWishLink = async () => {
    await navigator.clipboard.writeText(wishUrl);
    setCopiedWish(true);
    setTimeout(() => setCopiedWish(false), 2500);
  };

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(liveUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.stepContainer} style={{ opacity: 0.6, width: '100%', maxWidth: '600px', margin: '100px auto 0 auto' }}>
          <div className={styles.introHeader} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div className="skeleton" style={{ width: '35%', height: '1.25rem' }} />
            <div className="skeleton" style={{ width: '80%', height: '4rem', margin: '0.5rem 0' }} />
            <div className="skeleton" style={{ width: '60%', height: '1rem' }} />
          </div>
          
          <div className="skeleton" style={{ width: '280px', height: '54px', borderRadius: 'var(--radius-xl)', marginTop: '1rem' }} />
          
          <div className={styles.wishCollectorCard} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', padding: '2rem' }}>
            <div className="skeleton" style={{ width: '45%', height: '1.25rem' }} />
            <div className="skeleton" style={{ width: '95%', height: '1rem' }} />
            <div className="skeleton" style={{ width: '85%', height: '1rem' }} />
            <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '0.5rem' }}>
              <div className="skeleton" style={{ flex: 1, height: '42px', borderRadius: 'var(--radius-md)' }} />
              <div className="skeleton" style={{ width: '90px', height: '42px', borderRadius: 'var(--radius-md)' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className={styles.page}>
        <div className={styles.stateCenter}>
          <span className={styles.errorIcon}>💔</span>
          <h1 className={styles.errorTitle}>Celebration not found</h1>
          <p className={styles.errorDesc}>This link may have expired or is incorrect.</p>
          <button onClick={() => router.push('/')} className="btn btn--primary">Go Home</button>
        </div>
      </div>
    );
  }

  // Parse photos array safely
  const photos = (() => {
    if (!event.photo_url) return [];
    try {
      const parsed = JSON.parse(event.photo_url);
      return Array.isArray(parsed) ? parsed : [event.photo_url];
    } catch {
      return [event.photo_url];
    }
  })();

  const themeStyle = Object.fromEntries(
    Object.entries(THEME_TOKENS[event.theme]).map(([k, v]) => [k, v])
  ) as React.CSSProperties;

  // Resolve music preset
  const resolvedMusicUrl = (() => {
    if (!event.music_preset || event.music_preset === 'none') return '';
    if (event.music_preset === 'custom') return event.custom_music_data ?? '';
    const track = MUSIC_TRACKS.find((t) => t.id === event.music_preset);
    return track?.url ?? '';
  })();

  // Render Dynamic Titles based on Occasion
  const getOccasionWording = () => {
    const type = event.event_type;
    if (type === 'birthday') {
      return {
        title: 'Happy Birthday',
        subtitle: 'Blow the candles, cut the cake, and enjoy wishes from your friends! 🎂',
        btn: 'Let\'s Cut the Cake! 🔪',
        header: 'PARTY TIME!'
      };
    }
    if (type === 'baby_shower') {
      return {
        title: 'A New Journey Begins',
        subtitle: 'As you welcome your little one, let\'s celebrate this beautiful milestone together! 🍼',
        btn: 'Join the Celebration! 🧸',
        header: 'CONGRATULATIONS!'
      };
    }
    if (type === 'anniversary' || type === 'valentine' || type === 'engagement') {
      return {
        title: 'Celebrating Togetherness',
        subtitle: 'Wishes for a lifetime of love, laughter, and beautiful memories! ❤️',
        btn: 'Toast to Love! 🥂',
        header: 'LOVE IS IN THE AIR!'
      };
    }
    if (type === 'graduation' || type === 'promotion') {
      return {
        title: 'Huge Congratulations!',
        subtitle: 'You worked hard for this milestone. Let\'s celebrate your amazing achievement! 🌟',
        btn: 'Start the Celebration! 🚀',
        header: 'SUCCESS!'
      };
    }
    if (type === 'farewell' || type === 'retirement') {
      return {
        title: 'A Beautiful Journey',
        subtitle: 'Unpack the memories we\'ve shared and look forward to the next chapter! 🌅',
        btn: 'Open the Memory Box 📦',
        header: 'WE WILL MISS YOU!'
      };
    }
    if (type === 'get_well_soon') {
      return {
        title: 'Healing Thoughts',
        subtitle: 'Sending you warmth, love, and a garden of healing wishes! 🌸',
        btn: 'Water the Flowers 💧',
        header: 'GET WELL SOON!'
      };
    }
    return {
      title: 'Congratulations!',
      subtitle: 'Let\'s pause, smile, and celebrate this special moment together! ✨',
      btn: 'Start Celebrating! 🎉',
      header: 'CELEBRATE THE MOMENT!'
    };
  };

  const occasionWord = getOccasionWording();

  return (
    <div className={styles.page} style={themeStyle}>
      {/* Background Floating Emojis */}
      <div className={styles.bgEmojis} aria-hidden="true">
        {floatingEmojis.map((item) => (
          <motion.div
            key={item.id}
            initial={{ y: '110vh', x: `${item.x}vw`, opacity: 0 }}
            animate={{
              y: '-10vh',
              opacity: [0, 0.8, 0.8, 0],
              rotate: [0, 15, -15, 0],
            }}
            transition={{
              duration: item.duration,
              delay: item.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
            className={styles.floatingEmoji}
          >
            {item.emoji}
          </motion.div>
        ))}
      </div>

      {/* Background Overlay */}
      <div className={styles.bgOverlay} aria-hidden="true" />

      {/* Top Left Navigation Buttons */}
      <div className={styles.navTop}>
        <button
          type="button"
          onClick={() => router.push('/')}
          className={styles.navIconBtn}
          title="Go to Home"
        >
          <Home size={20} />
        </button>
      </div>

      {/* Content orchestration by Steps */}
      <div className={styles.contentWrapper}>
        <AnimatePresence mode="wait">
          {/* ── STAGE 1: INTRO ── */}
          {step === 'intro' && (
            <motion.div
              key="intro"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.8 }}
              className={styles.stepContainer}
            >
              <div className={styles.introHeader}>
                <h2 className={styles.introOccasion}>{occasionWord.title}</h2>
                <motion.h1
                  animate={{
                    y: [0, -10, 0],
                    scale: [1, 1.03, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className={styles.introName}
                >
                  {event.recipient_name}
                </motion.h1>
                <p className={styles.introSubtitle}>{occasionWord.subtitle}</p>
              </div>

              <button
                type="button"
                onClick={() => setStep('cake')}
                className={`btn btn--primary btn--lg ${styles.startBtn}`}
              >
                {occasionWord.btn} <ArrowRight size={20} style={{ marginLeft: 8 }} />
              </button>

              {/* Collector Board sharing */}
              <div className={styles.wishCollectorCard}>
                <h3 className={styles.collectorTitle}>Collect Wishes from Friends 💌</h3>
                <p className={styles.collectorDesc}>
                  Share this wish-collection link. Friends can send wishes in real-time, and they will float up as bubbles during the celebration!
                </p>
                <div className={styles.shareRow}>
                  <input
                    type="text"
                    readOnly
                    value={wishUrl}
                    className={styles.shareInput}
                  />
                  <button
                    type="button"
                    onClick={copyWishLink}
                    className={`btn btn--ghost ${styles.shareCopyBtn}`}
                  >
                    <Clipboard size={16} />
                    {copiedWish ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0, textAlign: 'center', fontWeight: 500 }}>📲 Scan to post wishes in real-time:</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(wishUrl)}`} 
                    alt="Wish QR Code" 
                    style={{ width: '120px', height: '120px', borderRadius: 'var(--radius-sm)', border: '4px solid white', boxShadow: 'var(--shadow-md)' }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STAGE 2: INTERACTIVE CAKE ── */}
          {step === 'cake' && (
            <motion.div
              key="cake"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.8 }}
              className={styles.stepContainer}
            >
              <LiveCakeDisplay
                flavor={event.cake_flavor ?? 'chocolate'}
                recipientName={event.recipient_name}
                eventType={event.event_type}
                onComplete={() => setStep('party')}
              />
            </motion.div>
          )}

          {/* ── STAGE 3: PARTY ── */}
          {step === 'party' && (
            <motion.div
              key="party"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={styles.partyContainer}
            >
              {/* Floating images in background */}
              {photos.length > 0 && <LiveImageCarousel images={photos} eventType={event.event_type} />}

              {/* Floating wishes bubbles */}
              <LiveFloatingWishes celebrationId={event.id} />

              <div className={styles.partyHeader}>
                <h1 className={styles.partyBounceTitle}>{occasionWord.header}</h1>

                <div className={styles.cardWrapper}>
                  <h2 className={styles.cardFor}>For {event.recipient_name}</h2>
                  <p className={styles.cardMessage}>&ldquo;{event.custom_message}&rdquo;</p>
                  <p className={styles.cardSender}>&mdash; From {event.sender_name} 💖</p>
                </div>
              </div>

              {/* Live Wishes Board Wall */}
              <LiveWishesWall celebrationId={event.id} eventType={event.event_type} />

              {/* Sticky bottom buttons */}
              <div className={styles.actionRowBottom}>
                <button
                  type="button"
                  onClick={copyShareLink}
                  className={`btn btn--ghost ${styles.bottomActionBtn}`}
                >
                  <Share2 size={16} style={{ marginRight: 8 }} />
                  {copiedShare ? 'Link Copied!' : 'Share Live Board'}
                </button>
                <button
                  type="button"
                  onClick={copyWishLink}
                  className={`btn btn--ghost ${styles.bottomActionBtn}`}
                >
                  <Clipboard size={16} style={{ marginRight: 8 }} />
                  {copiedWish ? 'Link Copied!' : 'Get Wish Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className={`btn btn--ghost ${styles.bottomActionBtn}`}
                >
                  <QrCode size={16} style={{ marginRight: 8 }} />
                  Wishes QR
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Music player controls */}
      {resolvedMusicUrl && (
        <MusicPlayer 
          trackUrl={resolvedMusicUrl} 
          loop 
          forcePlay={step !== 'intro'}
        />
      )}

      {/* QR Code Modal Overlay */}
      {showQrModal && (
        <div 
          className={styles.modalOverlay} 
          onClick={() => setShowQrModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Wishes QR Code Modal"
        >
          <div 
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button" 
              className={styles.modalCloseBtn}
              onClick={() => setShowQrModal(false)}
              aria-label="Close modal"
            >
              ✕
            </button>
            <h2 className={styles.modalTitle}>Scan to Send Wishes 💌</h2>
            <p className={styles.modalDesc}>
              Have friends scan this code with their phone cameras to post live wishes and balloons on your screen!
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(wishUrl)}`} 
              alt="Wishes Page QR Code" 
              className={styles.modalQrImg}
            />
            <div className={styles.modalLinkBox}>
              <span className={styles.modalLinkText}>{wishUrl}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
