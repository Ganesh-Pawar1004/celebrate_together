import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <span className={styles.logo}>🎊 CelebrateTogether</span>
          <p className={styles.tagline}>
            Distance doesn&apos;t stop love from celebrating.
          </p>
        </div>

        <nav className={styles.links} aria-label="Footer navigation">
          <div className={styles.linkGroup}>
            <h3 className={styles.linkHeading}>Product</h3>
            <ul role="list">
              <li><Link href="/create">Create Celebration</Link></li>
              <li><Link href="/#how-it-works">How It Works</Link></li>
              <li><Link href="/#occasions">Occasions</Link></li>
              <li><Link href="/dashboard">Dashboard</Link></li>
            </ul>
          </div>
          <div className={styles.linkGroup}>
            <h3 className={styles.linkHeading}>Celebrate</h3>
            <ul role="list">
              <li><Link href="/create?type=birthday">🎂 Birthday</Link></li>
              <li><Link href="/create?type=anniversary">💍 Anniversary</Link></li>
              <li><Link href="/create?type=baby_shower">🍼 Baby Shower</Link></li>
              <li><Link href="/create?type=graduation">🎓 Graduation</Link></li>
            </ul>
          </div>
          <div className={styles.linkGroup}>
            <h3 className={styles.linkHeading}>Legal</h3>
            <ul role="list">
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </nav>
      </div>

      <div className={`container ${styles.bottom}`}>
        <p>© {new Date().getFullYear()} CelebrateTogether. Made with 💖 for long-distance love.</p>
      </div>
    </footer>
  );
}
