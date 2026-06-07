'use client';

import { useState } from 'react';
import { LiveCandle } from './LiveCandle';
import confetti from 'canvas-confetti';
import type { EventType } from '@/lib/types';
import { EVENT_LABELS } from '@/lib/types';
import styles from './LiveCakeDisplay.module.css';

interface LiveCakeDisplayProps {
  flavor: string;
  recipientName: string;
  onComplete: () => void;
  eventType: EventType;
}

export function LiveCakeDisplay({ flavor, recipientName, onComplete, eventType }: LiveCakeDisplayProps) {
  const [candlesLit, setCandlesLit] = useState(true);
  const [slicesCut, setSlicesCut] = useState(0);
  const totalSlices = 8;

  const isBirthday = eventType === 'birthday';
  const isBabyShower = eventType === 'baby_shower';
  const isLoveEvent = eventType === 'anniversary' || eventType === 'valentine' || eventType === 'engagement';

  const getFlavorColors = (flv: string) => {
    switch (flv) {
      case 'chocolate':
        return {
          base: styles.flavorChocolateBase,
          top: styles.flavorChocolateTop,
          frosting: styles.flavorChocolateFrosting
        };
      case 'strawberry':
        return {
          base: styles.flavorStrawberryBase,
          top: styles.flavorStrawberryTop,
          frosting: styles.flavorStrawberryFrosting
        };
      case 'red-velvet':
        return {
          base: styles.flavorRedVelvetBase,
          top: styles.flavorRedVelvetTop,
          frosting: styles.flavorRedVelvetFrosting
        };
      default: // vanilla
        return {
          base: styles.flavorVanillaBase,
          top: styles.flavorVanillaTop,
          frosting: styles.flavorVanillaFrosting
        };
    }
  };

  const colors = getFlavorColors(flavor);

  const handleBlowCandles = () => {
    setCandlesLit(false);
    // Burst of confetti on blowing candles / starting celebration
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleCutSlice = () => {
    if (candlesLit && isBirthday) return; // Must blow candles first
    if (slicesCut >= totalSlices) return;

    setSlicesCut((prev) => prev + 1);

    // Visual feedback for cut (simple particle effect)
    confetti({
      particleCount: 20,
      spread: 40,
      origin: { y: 0.65 },
      colors: isBabyShower 
        ? ['#b2f5ea', '#bee3f8', '#e9d8fd', '#fbb6ce', '#fefcbf']
        : isLoveEvent 
        ? ['#ff6b9d', '#ff8fb1', '#ff0000', '#ffd166']
        : undefined
    });

    if (slicesCut + 1 >= totalSlices) {
      setTimeout(onComplete, 1200);
    }
  };

  // Resolve themed header or items on the cake
  const renderCakeTopDecoration = () => {
    if (isBirthday) {
      return (
        <>
          <LiveCandle isLit={candlesLit} />
          <LiveCandle isLit={candlesLit} />
          <LiveCandle isLit={candlesLit} />
        </>
      );
    }

    let text = '✨ Celebrate!';
    if (isBabyShower) text = '🍼 Oh Baby!';
    else if (eventType === 'anniversary') text = '💍 Happy Anniversary!';
    else if (eventType === 'valentine') text = '💖 Be Mine!';
    else if (eventType === 'engagement') text = '💎 Forever!';
    else if (eventType === 'graduation') text = '🎓 Congrats Grad!';
    else if (eventType === 'promotion') text = '💼 Level Up!';
    else if (eventType === 'housewarming') text = '🏠 Welcome Home!';

    return (
      <div className={`${styles.cakeBadge} ${!candlesLit ? styles.cakeBadgePopped : ''}`}>
        {text}
      </div>
    );
  };

  const getButtonText = () => {
    if (isBirthday) return 'Blow Candles 💨';
    if (isBabyShower) return 'Celebrate Baby Shower 🍼';
    if (isLoveEvent) return 'Celebrate Love 💖';
    if (eventType === 'graduation') return 'Start Graduation Party 🎓';
    if (eventType === 'promotion') return 'Celebrate Promotion 💼';
    if (eventType === 'housewarming') return 'Enter New Home 🏠';
    return 'Celebrate the Moment 🎉';
  };

  const getCutInstructions = () => {
    if (slicesCut >= totalSlices) {
      return 'Let the party begin! 🥳';
    }
    if (isBirthday) {
      return `Click the cake to cut a slice for guests! 🔪`;
    }
    return `Click the cake to serve the celebration! 🍰`;
  };

  return (
    <div className={styles.container}>
      {/* Cake Display */}
      <div className={styles.cakeContainer}>
        {/* Decorations / Candles on top */}
        <div className={styles.decorationsContainer}>
          {renderCakeTopDecoration()}
        </div>

        {/* Cake Body */}
        <div className={styles.cakeBody}>
          {/* Cake Top Surface */}
          <div className={`${styles.cakeSurface} ${colors.top}`}>
            <span className={styles.recipientName}>{recipientName}</span>
          </div>

          {/* Cake Side Base */}
          <div className={`${styles.cakeSide} ${colors.base}`}>
            {/* Frosting Drips */}
            <div className={`${styles.frostingDrips} ${colors.frosting}`} />
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
        {candlesLit && isBirthday ? (
          <button
            type="button"
            onClick={handleBlowCandles}
            className={`btn btn--primary btn--lg ${styles.actionBtn}`}
          >
            {getButtonText()}
          </button>
        ) : (candlesLit && !isBirthday) ? (
          <button
            type="button"
            onClick={handleBlowCandles}
            className={`btn btn--primary btn--lg ${styles.actionBtn}`}
          >
            {getButtonText()}
          </button>
        ) : (
          <div className={styles.instructionsBox}>
            <p className={styles.instructionText}>{getCutInstructions()}</p>
            <div className={styles.progressContainer}>
              <span className={styles.progressLabel}>Slices Served:</span>
              <span className={styles.progressValue}>
                {slicesCut} / {totalSlices}
              </span>
            </div>
            {/* Progress bar */}
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
