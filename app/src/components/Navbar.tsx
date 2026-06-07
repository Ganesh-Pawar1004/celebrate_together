'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });

    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session) {
          if (window.location.pathname === '/' || window.location.pathname === '/login') {
            window.location.href = '/dashboard';
          }
        }
      });

      return () => {
        window.removeEventListener('scroll', onScroll);
        subscription.unsubscribe();
      };
    }

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSignOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
      setUser(null);
      window.location.href = '/';
    }
  };

  if (pathname?.startsWith('/celebrate/')) {
    return null;
  }

  return (
    <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`} role="banner">
      <nav className={`${styles.inner} container`} aria-label="Main navigation">
        {/* Logo */}
        <Link href="/" className={styles.logo} aria-label="CelebrateTogether home">
          <span className={styles.logoIcon} aria-hidden="true">🎊</span>
          <span className={styles.logoText}>
            Celebrate<strong>Together</strong>
          </span>
        </Link>

        {/* Desktop links */}
        <ul className={styles.links} role="list">
          <li><Link href="/#how-it-works" className={styles.link}>How It Works</Link></li>
          <li><Link href="/#occasions" className={styles.link}>Occasions</Link></li>
          <li><Link href="/dashboard" className={styles.link}>Dashboard</Link></li>
        </ul>

        {/* CTA */}
        <div className={styles.actions}>
          {user ? (
            <button onClick={handleSignOut} className="btn btn--ghost btn--sm">
              Sign Out
            </button>
          ) : (
            <Link href="/login" className="btn btn--ghost btn--sm">Sign In</Link>
          )}
          <Link href="/create" className="btn btn--primary btn--sm">
            Create Celebration ✨
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className={styles.hamburger}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className={`${styles.bar} ${menuOpen ? styles.barOpen1 : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.barOpen2 : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.barOpen3 : ''}`} />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileMenu} role="dialog" aria-label="Mobile navigation">
          <ul role="list" className={styles.mobileLinks}>
            <li><Link href="/#how-it-works" onClick={() => setMenuOpen(false)}>How It Works</Link></li>
            <li><Link href="/#occasions" onClick={() => setMenuOpen(false)}>Occasions</Link></li>
            <li><Link href="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link></li>
            {user ? (
              <li>
                <button
                  onClick={() => { handleSignOut(); setMenuOpen(false); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    width: '100%',
                    fontSize: 'var(--text-base-size)',
                    fontFamily: 'inherit',
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                    display: 'block',
                    padding: 'var(--space-2) 0',
                    borderBottom: '1px solid var(--surface-border)',
                    cursor: 'pointer'
                  }}
                >
                  Sign Out
                </button>
              </li>
            ) : (
              <li><Link href="/login" onClick={() => setMenuOpen(false)}>Sign In</Link></li>
            )}
            <li>
              <Link href="/create" className="btn btn--primary" onClick={() => setMenuOpen(false)}>
                Create Celebration ✨
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
