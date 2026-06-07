'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getWishes } from '@/lib/wishesStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Wish, EventType } from '@/lib/types';
import styles from './LiveWishesWall.module.css';

interface LiveWishesWallProps {
  celebrationId: string;
  eventType: EventType;
}

const STICKY_COLORS = [
  styles.stickyYellow,
  styles.stickyPink,
  styles.stickyBlue,
  styles.stickyGreen,
  styles.stickyPurple,
  styles.stickyOrange,
];

export function LiveWishesWall({ celebrationId, eventType }: LiveWishesWallProps) {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [rotations, setRotations] = useState<number[]>([]);

  useEffect(() => {
    const loadWishes = async () => {
      const allWishes = await getWishes(celebrationId);
      setWishes(allWishes);
      
      // Generate stable rotations on the client to avoid hydration mismatch
      setRotations((prev) => {
        if (prev.length === allWishes.length) return prev;
        return allWishes.map(() => Math.random() * 6 - 3);
      });
    };

    loadWishes();

    if (!isSupabaseConfigured) {
      // Fallback: poll for local storage changes in demo mode
      const interval = setInterval(loadWishes, 3000);
      return () => clearInterval(interval);
    }

    // Setup Realtime subscription
    const channel = supabase
      .channel(`wishes-wall-${celebrationId}`)
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
          setRotations((prev) => [Math.random() * 6 - 3, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [celebrationId]);

  if (wishes.length === 0) return null;

  const getWallTitle = () => {
    switch (eventType) {
      case 'birthday':
        return 'Birthday Wishes 🎂';
      case 'baby_shower':
        return 'Baby Shower Blessings 🍼';
      case 'anniversary':
        return 'Anniversary Wishes 💍';
      case 'valentine':
        return 'Love Notes ❤️';
      case 'engagement':
        return 'Wishes for the Couple 💎';
      case 'graduation':
        return 'Graduation Wishes 🎓';
      case 'promotion':
        return 'Congratulatory Wishes 💼';
      case 'housewarming':
        return 'Warm Housewarming Notes 🏠';
      default:
        return 'Celebration Wishes ✨';
    }
  };

  return (
    <div className={styles.wallWrapper}>
      <h2 className={styles.wallTitle}>{getWallTitle()}</h2>
      <div className={styles.grid}>
        {wishes.map((wish, index) => {
          const rotation = rotations[index] ?? 0;
          const colorClass = STICKY_COLORS[index % STICKY_COLORS.length];

          return (
            <motion.div
              key={wish.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: Math.min(index * 0.08, 1.2), type: 'spring' }}
              className={`${styles.sticky} ${colorClass}`}
              style={{ rotate: `${rotation}deg` }}
            >
              {/* Tape Effect */}
              <div className={styles.tape} />

              <p className={styles.message}>&ldquo;{wish.message}&rdquo;</p>
              <p className={styles.author}>&mdash; {wish.name}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
