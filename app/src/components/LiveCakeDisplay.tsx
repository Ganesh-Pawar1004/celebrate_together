'use client';

import { useState } from 'react';
import { LiveCandle } from './LiveCandle';
import confetti from 'canvas-confetti';
import type { EventType } from '@/lib/types';
import styles from './LiveCakeDisplay.module.css';

interface LiveCakeDisplayProps {
  flavor: string;
  cakeType?: 'classic' | 'tiered' | 'cupcake' | 'cheesecake';
  candleCount?: number | null;
  topper?: 'candles' | 'heart' | 'flag' | 'flowers';
  decorations?: 'none' | 'sprinkles' | 'stars' | 'floral';
  recipientName: string;
  onComplete: () => void;
  eventType: EventType;
}

export function LiveCakeDisplay({ 
  flavor, 
  cakeType = 'classic',
  candleCount = 3,
  topper = 'candles',
  decorations = 'none',
  recipientName, 
  onComplete, 
  eventType 
}: LiveCakeDisplayProps) {
  const [candlesLit, setCandlesLit] = useState(true);
  const [slicesCut, setSlicesCut] = useState(0);
  const totalSlices = cakeType === 'cupcake' ? 1 : cakeType === 'cheesecake' ? 4 : 8;

  const isLoveEvent = eventType === 'anniversary' || eventType === 'valentine' || eventType === 'engagement';

  const getFlavorColors = (flv: string) => {
    switch (flv) {
      case 'chocolate':
        return { base: styles.flavorChocolateBase, top: styles.flavorChocolateTop, frosting: styles.flavorChocolateFrosting };
      case 'strawberry':
        return { base: styles.flavorStrawberryBase, top: styles.flavorStrawberryTop, frosting: styles.flavorStrawberryFrosting };
      case 'red-velvet':
        return { base: styles.flavorRedVelvetBase, top: styles.flavorRedVelvetTop, frosting: styles.flavorRedVelvetFrosting };
      default: // vanilla
        return { base: styles.flavorVanillaBase, top: styles.flavorVanillaTop, frosting: styles.flavorVanillaFrosting };
    }
  };

  const colors = getFlavorColors(flavor);

  const handleInteract = () => {
    if (topper === 'candles' && candlesLit) {
      setCandlesLit(false);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } else if (candlesLit) {
      // For non-candle toppers, the first click initiates the celebration
      setCandlesLit(false);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
  };

  const handleCutSlice = (e: React.MouseEvent) => {
    if (candlesLit) return; // Must blow candles or initiate first
    if (slicesCut >= totalSlices) return;

    setSlicesCut((prev) => prev + 1);

    // Burst from click position
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    confetti({
      particleCount: 25,
      spread: 50,
      origin: { x: Math.max(0.2, Math.min(0.8, x)), y: 0.65 },
      colors: isLoveEvent 
        ? ['#ff6b9d', '#ff8fb1', '#ff0000', '#ffd166']
        : undefined
    });

    if (slicesCut + 1 >= totalSlices) {
      setTimeout(onComplete, 1200);
    }
  };

  // Render Candles
  const renderCandles = () => {
    const count = candleCount ?? 3;
    if (count <= 9) {
      return (
        <div className={styles.candlesWrapper}>
          {[...Array(count)].map((_, i) => (
            <LiveCandle key={i} isLit={candlesLit} />
          ))}
        </div>
      );
    }
    // Render number candles for large counts
    const numStr = count.toString();
    return (
      <div className={styles.candlesWrapper}>
        {numStr.split('').map((digit, i) => (
          <div key={i} className={styles.numberCandle}>
            <span className={styles.numberCandleText}>{digit}</span>
            <div className={`${styles.flame} ${!candlesLit ? styles.extinguished : ''}`} />
          </div>
        ))}
      </div>
    );
  };

  // Resolve themed header or items on the cake
  const renderCakeTopDecoration = () => {
    if (topper === 'candles') return renderCandles();
    if (topper === 'heart') return <div className={`${styles.cakeBadge} ${!candlesLit ? styles.cakeBadgePopped : ''}`}>💖 Forever!</div>;
    if (topper === 'flag') return <div className={`${styles.cakeBadge} ${!candlesLit ? styles.cakeBadgePopped : ''}`}>🚩 Next Chapter!</div>;
    if (topper === 'flowers') return <div className={`${styles.cakeBadge} ${!candlesLit ? styles.cakeBadgePopped : ''}`}>🌸 Bloom!</div>;
    
    return <div className={`${styles.cakeBadge} ${!candlesLit ? styles.cakeBadgePopped : ''}`}>✨ Celebrate!</div>;
  };

  const getButtonText = () => {
    if (topper === 'candles') return 'Blow Candles 💨';
    return 'Start Celebration 🎉';
  };

  const getCutInstructions = () => {
    if (slicesCut >= totalSlices) return 'Let the party begin! 🥳';
    if (cakeType === 'cupcake') return 'Take the cupcake! 🧁';
    return 'Click to slice the cake! 🔪';
  };

  return (
    <div className={styles.container}>
      <div className={styles.cakeContainer}>
        {/* Decorations / Candles on top */}
        <div 
          className={styles.decorationsContainer}
          style={{ transform: cakeType === 'tiered' ? 'translateY(-35px)' : 'translateY(0)' }}
        >
          {renderCakeTopDecoration()}
        </div>

        {/* Cake Body Dynamic Shapes */}
        <div className={`${styles.cakeBody} ${styles['shape_' + cakeType]} ${!candlesLit ? styles.cuttable : ''}`}>
          
          {cakeType === 'tiered' && (
            <div className={`${styles.topTier} ${colors.base}`}>
              <div className={`${styles.tierTop} ${colors.top}`} />
            </div>
          )}

          {/* Cake Top Surface */}
          <div className={`${styles.cakeSurface} ${colors.top}`}>
            <span className={styles.recipientName}>{recipientName}</span>
            {/* Cut visual wedges */}
            {slicesCut > 0 && cakeType !== 'cupcake' && (
              <div 
                className={styles.cutOverlay} 
                style={{ 
                  background: `conic-gradient(transparent 0deg, transparent ${slicesCut * (360 / totalSlices)}deg, rgba(255,255,255,0.1) ${slicesCut * (360 / totalSlices)}deg, rgba(255,255,255,0.1) 360deg)`
                }} 
              />
            )}
          </div>

          {/* Cake Side Base */}
          <div className={`${styles.cakeSide} ${colors.base}`}>
            {/* Frosting Drips */}
            <div className={`${styles.frostingDrips} ${colors.frosting}`} />
            
            {/* Decorations Pattern */}
            {decorations !== 'none' && (
              <div className={`${styles.decorationsPattern} ${styles['decor_' + decorations]}`} />
            )}
          </div>
        </div>

        {/* Click target for cutting (only active when candles are unlit/celebration started) */}
        {!candlesLit && (
          <div 
            className={styles.clickTarget} 
            onClick={handleCutSlice}
            role="button"
            aria-label="Cut cake slice"
          />
        )}
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        {candlesLit ? (
          <button
            type="button"
            onClick={handleInteract}
            className={`btn btn--primary btn--lg ${styles.actionBtn}`}
          >
            {getButtonText()}
          </button>
        ) : (
          <div className={styles.instructionsBox}>
            <p className={styles.instructionText}>{getCutInstructions()}</p>
            <div className={styles.progressContainer}>
              <span className={styles.progressLabel}>{cakeType === 'cupcake' ? 'Eaten:' : 'Slices Served:'}</span>
              <span className={styles.progressValue}>
                {slicesCut} / {totalSlices}
              </span>
            </div>
            <div className={styles.progressBarBg}>
              <div 
                className={styles.progressBarFill} 
                style={{ width: `${(slicesCut / totalSlices) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
