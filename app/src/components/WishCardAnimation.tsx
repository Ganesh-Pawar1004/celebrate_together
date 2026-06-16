'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import styles from './WishCardAnimation.module.css';

interface WishCardAnimationProps {
  name: string;
  message: string;
  onComplete: () => void;
}

type Phase = 'writing' | 'envelope-appears' | 'packing' | 'sealing' | 'flying';

export function WishCardAnimation({ name, message, onComplete }: WishCardAnimationProps) {
  const [phase, setPhase] = useState<Phase>('writing');

  useEffect(() => {
    // 1. Signature finishes drawing. Envelope glides up from shadow.
    const envTimer = setTimeout(() => {
      setPhase('envelope-appears');
    }, 2800);

    // 2. Card drops smoothly into the pocket.
    const packTimer = setTimeout(() => {
      setPhase('packing');
    }, 4200);

    // 3. Flap folds down and wax seal stamps.
    const sealTimer = setTimeout(() => {
      setPhase('sealing');
      // Burst of golden particles right as the wax seal hits!
      setTimeout(() => {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#ffd700', '#ffaa00', '#ffffff'],
          disableForReducedMotion: true,
          zIndex: 100
        });
      }, 500); // 0.5s after flap starts folding
    }, 5000);

    // 4. The whole sealed envelope tilts back and shoots off into 3D space.
    const flyTimer = setTimeout(() => {
      setPhase('flying');
    }, 6500);

    // 5. Complete transition
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 8000);

    return () => {
      clearTimeout(envTimer);
      clearTimeout(packTimer);
      clearTimeout(sealTimer);
      clearTimeout(flyTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className={styles.overlay}>
      <AnimatePresence>
        {phase !== 'flying' ? (
          <motion.div 
            key="animation-container"
            className={styles.animationContainer}
            // Flight exit animation: tilts back, shrinks, shoots diagonally up/right
            initial={{ y: 0, opacity: 1, scale: 1, rotateZ: 0, rotateX: 0 }}
            exit={{ 
              y: -1200, 
              x: 600, 
              opacity: 0, 
              scale: 0.3, 
              rotateZ: 35, 
              rotateX: 60 
            }}
            transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
          >
            
            {/* --- The Envelope --- */}
            <motion.div 
              className={styles.envelopeContainer}
              initial={{ y: 400, opacity: 0, scale: 0.85, rotateX: 15 }}
              animate={{ 
                // Physical weight dip: Envelope gets pushed down when card slides in!
                y: phase === 'writing' ? 400 : (phase === 'packing' ? 20 : 0), 
                opacity: phase === 'writing' ? 0 : 1,
                scale: phase === 'packing' ? 0.96 : 1,
                rotateX: 0
              }}
              transition={{ type: 'spring', damping: 14, stiffness: 90 }}
            >
              <div className={styles.envelopeBack} />
              <div className={styles.envelopeFront} />
              
              <motion.div 
                className={styles.envelopeFlap}
                initial={{ rotateX: 0 }}
                animate={{ rotateX: phase === 'sealing' ? 180 : 0 }}
                transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }} // Heavy paper fold
              >
                {/* The glossy Wax Seal pops in immediately after the fold completes */}
                {phase === 'sealing' && (
                  <motion.div 
                    className={styles.waxSeal}
                    initial={{ scale: 0, opacity: 0, rotateX: 180 }} // Note: rotateX 180 because flap is flipped!
                    animate={{ scale: 1, opacity: 1, rotateX: 180 }}
                    transition={{ delay: 0.45, type: 'spring', damping: 8, stiffness: 200 }}
                  />
                )}
              </motion.div>
            </motion.div>

            {/* --- The Premium Card --- */}
            <motion.div
              className={styles.card}
              initial={{ scale: 0.95, y: -40, opacity: 0 }}
              animate={{ 
                opacity: 1,
                scale: phase === 'writing' || phase === 'envelope-appears' ? 1 : 0.44, 
                // Card drops perfectly into the pocket bounds
                y: phase === 'writing' || phase === 'envelope-appears' ? 0 : 260, 
                rotateZ: phase === 'writing' || phase === 'envelope-appears' ? 0 : -2
              }}
              transition={{ 
                type: 'spring', 
                damping: 16, 
                stiffness: 85,
                opacity: { duration: 0.8 }
              }}
            >
              {phase === 'writing' && <div className={styles.cardGlow} />}
              
              <div className={styles.cardContent}>
                <p className={styles.messageText}>"{message}"</p>
                
                <div className={styles.signatureRow}>
                  <span className={styles.fromText}>With love,</span>
                  <motion.div
                    className={styles.signature}
                    initial={{ clipPath: 'inset(0 100% 0 0)' }}
                    animate={{ clipPath: 'inset(0 0% 0 0)' }}
                    transition={{ delay: 0.8, duration: 1.5, ease: "linear" }}
                  >
                    {name}
                  </motion.div>
                </div>
              </div>
              
              {/* Feather Pen Animation */}
              {phase === 'writing' && <div className={styles.penCursor} />}
            </motion.div>

          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
