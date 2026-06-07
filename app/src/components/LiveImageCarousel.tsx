'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './LiveImageCarousel.module.css';

interface LiveImageCarouselProps {
  images: string[];
  eventType?: string;
}

interface PhotoPlacement {
  img: string;
  x: number;
  y: number;
  rotate: number;
  width: number;
}

const CAPTIONS: Record<string, string[]> = {
  birthday: ['Special Day 🎂', 'Sweet Memory ✨', 'Happy Birthday 🎉', 'Cherished Moment 💫'],
  baby_shower: ['Tiny Miracle 🍼', 'Sweet Baby 🧸', 'Moments of Joy 🌟', 'Blessed Day 👼'],
  anniversary: ['Together Forever 💍', 'My Favorite Person 💖', 'Sweet Moments 🫶', 'Love Story ❤️'],
  valentine: ['Love You ❤️', 'My Favorite Person 💖', 'Sweet Moments 🫶', 'Together Forever 🌹'],
  engagement: ['Together Forever 💍', 'Love & Joy 💖', 'Special Moment ✨', 'Our Story 🫶'],
  default: ['Memory ✨', 'Special Day 🌟', 'Moments ❤️', 'Cherished Day 💫']
};

function getCaption(eventType: string | undefined, index: number): string {
  const category = eventType && CAPTIONS[eventType] ? eventType : 'default';
  const list = CAPTIONS[category];
  return list[index % list.length];
}

export function LiveImageCarousel({ images, eventType }: LiveImageCarouselProps) {
  const [placements, setPlacements] = useState<PhotoPlacement[]>([]);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeCaption, setActiveCaption] = useState<string>('');

  useEffect(() => {
    if (!images || images.length === 0) return;

    const width = window.innerWidth;
    const isMobile = width < 768;

    const items = images.map((img, index) => {
      const isLeft = index % 2 === 0;
      const total = images.length;

      // Distance from center to ensure it clears the central text card (max-w-2xl)
      const baseOffsetX = isMobile ? 70 : width * 0.32;
      const randomOffset = Math.random() * 20 - 10;

      const x = isLeft ? -baseOffsetX + randomOffset : baseOffsetX + randomOffset;

      // Stagger heights based on indices and image count to prevent clipping & overlap
      let baseY = 0;
      if (total === 1) {
        baseY = -20;
      } else if (total === 2) {
        baseY = isLeft ? 60 : -110;
      } else if (total === 3) {
        if (index === 0) baseY = -110;
        else if (index === 1) baseY = -80;
        else baseY = 100;
      } else {
        if (index === 0) baseY = -120;
        else if (index === 1) baseY = -120;
        else if (index === 2) baseY = 95;
        else baseY = 90;
      }

      const y = baseY + randomOffset;
      const rotateStart = isLeft ? -12 + (index * 4) : 8 - (index * 3);
      const rotate = rotateStart + (Math.random() * 6 - 3);

      return {
        img,
        x,
        y,
        rotate,
        width: isMobile ? 110 : 170,
      };
    });

    setPlacements(items);
  }, [images]);

  if (!images || images.length === 0 || placements.length === 0) return null;

  const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const isMobile = width < 768;

  return (
    <>
      <div className={styles.overlay} aria-hidden="true">
        {placements.map((p, index) => {
          const captionText = getCaption(eventType, index);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
              animate={{
                opacity: isMobile ? 0.35 : 1, // subtle watermark opacity on mobile
                scale: 1,
                x: p.x,
                y: p.y,
                rotate: p.rotate,
              }}
              whileHover={{
                scale: 1.05,
                rotate: p.rotate * 0.8,
                opacity: 1, // fully visible on hover/focus
                zIndex: 100,
              }}
              transition={{
                delay: index * 0.25,
                duration: 1.2,
                type: 'spring',
                bounce: 0.35,
              }}
              onClick={() => {
                setActiveImage(p.img);
                setActiveCaption(captionText);
              }}
              className={styles.polaroid}
              style={{
                width: `${p.width}px`,
              }}
            >
              <div className={styles.tape} />
              <div className={styles.imageContainer}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.img} alt={`Memory ${index + 1}`} className={styles.image} />
              </div>
              <p className={styles.caption}>{captionText}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {activeImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveImage(null)}
            className={styles.lightboxOverlay}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className={styles.lightboxCard}
            >
              <div className={styles.lightboxImageWrapper}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={activeImage} alt="Expanded Memory" className={styles.lightboxImage} />
              </div>
              {activeCaption && <p className={styles.lightboxCaption}>{activeCaption}</p>}
              <button
                onClick={() => setActiveImage(null)}
                className={styles.lightboxCloseBtn}
                aria-label="Close expanded image"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
