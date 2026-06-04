'use client';

import { motion } from 'framer-motion';
import styles from './LiveCandle.module.css';

interface CandleProps {
  isLit: boolean;
}

export function LiveCandle({ isLit }: CandleProps) {
  return (
    <div className={styles.candleWrapper}>
      {/* Flame */}
      <motion.div
        animate={isLit ? {
          scale: [1, 1.15, 0.9, 1],
          rotate: [-2, 2, -1, 1],
          opacity: 1,
        } : {
          scale: 0,
          opacity: 0,
        }}
        transition={isLit ? {
          duration: 0.5,
          repeat: Infinity,
          repeatType: "reverse",
        } : {
          duration: 0.5,
        }}
        className={styles.flame}
      />

      {/* Candle Body */}
      <div className={styles.candleBody}>
        <div className={styles.wick} />
        {/* Stripes */}
        <div className={`${styles.stripe} ${styles.stripe1}`} />
        <div className={`${styles.stripe} ${styles.stripe2}`} />
        <div className={`${styles.stripe} ${styles.stripe3}`} />
      </div>
    </div>
  );
}
