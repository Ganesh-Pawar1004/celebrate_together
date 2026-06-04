'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import styles from './LiveImageCarousel.module.css';

interface LiveImageCarouselProps {
  images: string[];
}

interface PhotoPlacement {
  img: string;
  x: number;
  y: number;
  rotate: number;
  width: number;
  height: number;
}

export function LiveImageCarousel({ images }: LiveImageCarouselProps) {
  const [placements, setPlacements] = useState<PhotoPlacement[]>([]);

  useEffect(() => {
    if (!images || images.length === 0) return;

    // Run this purely on client to safely measure window dimensions
    const width = window.innerWidth;
    const isMobile = width < 768;

    const items = images.map((img, index) => {
      const isLeft = index % 2 === 0;
      const isTop = index < 2;

      // Distance from center to ensure it clears the central text card (max-w-2xl)
      const baseOffsetX = isMobile ? 80 : width * 0.34;
      const randomOffset = Math.random() * 30 - 15;

      const x = isLeft ? -baseOffsetX + randomOffset : baseOffsetX + randomOffset;
      const baseY = isTop ? -200 : -10;
      const y = baseY + randomOffset;

      const rotateStart = Math.random() * 30 - 15; // -15 to 15 degrees
      const rotate = rotateStart + (Math.random() * 10 - 5);

      return {
        img,
        x,
        y,
        rotate,
        width: isMobile ? 120 : 180,
        height: isMobile ? 140 : 210,
      };
    });

    setPlacements(items);
  }, [images]);

  if (!images || images.length === 0 || placements.length === 0) return null;

  return (
    <div className={styles.overlay} aria-hidden="true">
      {placements.map((p, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: p.x,
            y: p.y,
            rotate: p.rotate,
          }}
          transition={{
            delay: index * 0.25,
            duration: 1.2,
            type: 'spring',
            bounce: 0.35,
          }}
          className={styles.polaroid}
          style={{
            width: `${p.width}px`,
            height: `${p.height}px`,
          }}
        >
          <div className={styles.tape} />
          <div className={styles.imageContainer}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.img} alt={`Memory ${index + 1}`} className={styles.image} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
