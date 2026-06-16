'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import styles from './LiveSparklesBackground.module.css';

export function LiveSparklesBackground() {
  const [sparkles, setSparkles] = useState<{ id: number; top: string; left: string; size: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    // Generate random sparkles
    const newSparkles = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 10 + 4, // 4px to 14px
      delay: Math.random() * 5, // 0 to 5s delay
      duration: Math.random() * 3 + 2, // 2s to 5s duration
    }));
    setSparkles(newSparkles);
  }, []);

  return (
    <div className={styles.sparklesContainer}>
      {sparkles.map(sparkle => (
        <motion.div
          key={sparkle.id}
          className={styles.sparkle}
          style={{
            top: sparkle.top,
            left: sparkle.left,
            width: sparkle.size,
            height: sparkle.size,
          }}
          initial={{ opacity: 0, scale: 0, rotate: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0.5],
            rotate: [0, 180],
          }}
          transition={{
            duration: sparkle.duration,
            delay: sparkle.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          ✨
        </motion.div>
      ))}
    </div>
  );
}
