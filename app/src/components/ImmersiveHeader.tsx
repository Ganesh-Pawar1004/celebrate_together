'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Gift } from 'lucide-react';
import styles from './ImmersiveHeader.module.css';

export default function ImmersiveHeader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Show for 2.5 seconds initially on mount, then hide
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2500);

    // Desktop hover logic: show when cursor is near the top of viewport
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY < 60) {
        setVisible(true);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <>
      {/* Immersive floating header */}
      <nav 
        className={`${styles.header} ${visible ? styles.visible : styles.hidden}`}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        aria-label="Immersive celebration menu"
      >
        <div className={styles.inner}>
          <Link href="/" className={styles.navLink}>
            <Home size={16} />
            <span>Home</span>
          </Link>
          <span className={styles.divider} aria-hidden="true">|</span>
          <Link href="/create" className={styles.navLink}>
            <Gift size={16} />
            <span>Create Celebration</span>
          </Link>
        </div>
      </nav>

      {/* Small floating indicator tab at the very top center */}
      <button 
        type="button"
        className={`${styles.indicator} ${visible ? styles.indHidden : styles.indVisible}`}
        onClick={() => setVisible(true)}
        onMouseEnter={() => setVisible(true)}
        aria-label="Show menu"
      >
        <span className={styles.indicatorArrow}>▼</span>
        <span className={styles.indicatorText}>Menu</span>
      </button>
    </>
  );
}
