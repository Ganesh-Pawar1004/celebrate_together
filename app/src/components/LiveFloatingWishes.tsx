'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWishes } from '@/lib/wishesStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Wish } from '@/lib/types';
import styles from './LiveFloatingWishes.module.css';

interface LiveFloatingWishesProps {
  celebrationId: string;
}

export function LiveFloatingWishes({ celebrationId }: LiveFloatingWishesProps) {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [visibleWishes, setVisibleWishes] = useState<{ wish: Wish; uniqueId: string }[]>([]);

  // Load wishes initially and subscribe to new wishes in real-time
  useEffect(() => {
    const loadWishes = async () => {
      const allWishes = await getWishes(celebrationId);
      setWishes(allWishes);
    };

    loadWishes();

    if (!isSupabaseConfigured) {
      // Fallback: poll for local storage changes in demo mode
      const interval = setInterval(loadWishes, 3000);
      return () => clearInterval(interval);
    }

    // Setup Realtime subscription for floating wishes
    const channel = supabase
      .channel(`wishes-floating-${celebrationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wishes',
          filter: `event_id=eq.${celebrationId}`,
        },
        (payload) => {
          const newWish = payload.new as Wish;
          setWishes((prev) => {
            if (prev.some((w) => w.id === newWish.id)) return prev;
            return [newWish, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [celebrationId]);

  // Stagger showing wishes in bubbles
  useEffect(() => {
    if (wishes.length === 0) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      setVisibleWishes((prev) => {
        const currentWish = wishes[currentIndex];
        if (!currentWish) return prev;

        const newWishItem = {
          wish: currentWish,
          uniqueId: `${currentWish.id}-${Date.now()}`,
        };

        const next = [...prev, newWishItem];
        if (next.length > 5) next.shift(); // Limit to 5 simultaneous bubbles to avoid clutter
        return next;
      });

      currentIndex = (currentIndex + 1) % wishes.length;
    }, 3500); // Spawn a new bubble every 3.5 seconds

    return () => clearInterval(interval);
  }, [wishes]);

  return (
    <div className={styles.overlay} aria-hidden="true">
      <AnimatePresence>
        {visibleWishes.map((item) => {
          // Horizontal positions spread across the screen
          const randomX = Math.random() * 65 + 10;
          return (
            <motion.div
              key={item.uniqueId}
              initial={{ y: '100vh', x: `${randomX}vw`, opacity: 0, scale: 0.6 }}
              animate={{
                y: '-25vh',
                opacity: [0, 0.95, 0.95, 0],
                scale: 1,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 10,
                ease: 'linear',
              }}
              className={styles.bubbleWrapper}
            >
              <div className={styles.bubble}>
                <p className={styles.message}>&ldquo;{item.wish.message}&rdquo;</p>
                <p className={styles.author}>&mdash; {item.wish.name}</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
