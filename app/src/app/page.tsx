import Link from 'next/link';
import styles from './page.module.css';
import { EVENT_LABELS } from '@/lib/types';

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: '✍️',
    title: 'Create Your Celebration',
    desc: 'Choose the occasion, write a heartfelt message, pick a theme, and set the reveal time — default is midnight.',
  },
  {
    step: '02',
    icon: '🔗',
    title: 'Share the Magic Link',
    desc: 'Send your loved one a secret link via WhatsApp, text, or email. Tell them to open it only at the right time.',
  },
  {
    step: '03',
    icon: '🎉',
    title: 'They Experience the Surprise',
    desc: 'A beautiful countdown begins. At zero — confetti, music, and your personalised message blooms on their screen.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Priya & Arjun',
    relation: 'Long-distance couple, Mumbai & London',
    quote: 'He surprised me at midnight with our anniversary wish. I cried happy tears — it felt like he was right there.',
    emoji: '💍',
  },
  {
    name: 'Sanjana Mehta',
    relation: 'Daughter in Toronto',
    quote: "My parents in Chennai thought I forgot their anniversary. The countdown reveal made my mom scream with joy!",
    emoji: '🎂',
  },
  {
    name: 'Raj & The Gang',
    relation: 'Friend group across 4 countries',
    quote: 'We all sent individual surprise links to our friend Deepa on her 30th. Best surprise birthday ever.',
    emoji: '🎊',
  },
];

export default function HomePage() {
  return (
    <>
      {/* ── HERO ── */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroBg} aria-hidden="true">
          <div className={styles.orb1} />
          <div className={styles.orb2} />
          <div className={styles.orb3} />
          {/* Floating particles */}
          {['💖', '🌟', '✨', '🎉', '💫', '🎊', '💕', '⭐'].map((p, i) => (
            <span key={i} className={styles.particle} style={{
              left: `${10 + i * 11}%`,
              animationDuration: `${6 + i * 1.5}s`,
              animationDelay: `${i * 0.8}s`,
              fontSize: `${0.9 + (i % 3) * 0.4}rem`,
            }}>
              {p}
            </span>
          ))}
        </div>

        <div className={`container ${styles.heroContent}`}>
          <span className={`badge badge--accent ${styles.heroBadge}`}>
            🌍 For long-distance love &amp; families
          </span>
          <h1 id="hero-title" className={styles.heroTitle}>
            Celebrate Every Milestone,{' '}
            <em className={styles.heroAccent}>Together</em>
          </h1>
          <p className={styles.heroSub}>
            Create personalised surprise celebrations for birthdays, anniversaries, baby showers and more.
            Share a secret countdown — your loved one experiences the magic at exactly the right moment.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/create" className="btn btn--primary btn--lg">
              Create a Surprise ✨
            </Link>
            <Link href="/#how-it-works" className="btn btn--ghost btn--lg">
              See How It Works
            </Link>
          </div>

          {/* Mini stats */}
          <div className={styles.heroStats} aria-label="Platform stats">
            <div className={styles.stat}>
              <strong>10k+</strong>
              <span>Surprises sent</span>
            </div>
            <div className={styles.statDivider} aria-hidden="true" />
            <div className={styles.stat}>
              <strong>50+</strong>
              <span>Countries reached</span>
            </div>
            <div className={styles.statDivider} aria-hidden="true" />
            <div className={styles.stat}>
              <strong>❤️</strong>
              <span>Made with love</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className={`section ${styles.howSection}`} id="how-it-works" aria-labelledby="how-title">
        <div className="container">
          <header className={styles.sectionHeader}>
            <span className={`badge badge--muted`}>Simple &amp; magical</span>
            <h2 id="how-title">How It Works</h2>
            <p>Three simple steps to create an unforgettable moment from anywhere in the world.</p>
          </header>

          <ol className={styles.steps} role="list">
            {HOW_IT_WORKS.map((item) => (
              <li key={item.step} className={`card ${styles.stepCard}`}>
                <div className={styles.stepNumber} aria-hidden="true">{item.step}</div>
                <div className={styles.stepIcon} aria-hidden="true">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── OCCASIONS ── */}
      <section className={`section ${styles.occasionsSection}`} id="occasions" aria-labelledby="occasions-title">
        <div className="container">
          <header className={styles.sectionHeader}>
            <span className={`badge badge--gold`}>Every occasion</span>
            <h2 id="occasions-title">What Can You Celebrate?</h2>
            <p>From intimate milestones to group celebrations — we have the perfect surprise for every moment.</p>
          </header>

          <ul className={styles.occasionGrid} role="list">
            {(Object.entries(EVENT_LABELS) as [string, { label: string; emoji: string }][]).map(([key, { label, emoji }]) => (
              <li key={key}>
                <Link
                  href={`/create?type=${key}`}
                  className={`card card--hoverable ${styles.occasionCard}`}
                  aria-label={`Create a ${label} celebration`}
                >
                  <span className={styles.occasionEmoji} aria-hidden="true">{emoji}</span>
                  <span className={styles.occasionLabel}>{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── REVEAL PREVIEW ── */}
      <section className={`section ${styles.previewSection}`} aria-labelledby="preview-title">
        <div className="container">
          <div className={styles.previewGrid}>
            <div className={styles.previewText}>
              <span className={`badge badge--accent`}>The magic moment</span>
              <h2 id="preview-title">A Countdown They&apos;ll Never Forget</h2>
              <p>
                Your loved one opens the secret link and sees a stunning countdown. The suspense builds.
                When the clock hits zero, an explosion of confetti fills their screen — followed by your heartfelt message.
              </p>
              <ul className={styles.featureList} role="list">
                <li>⏰ Schedules for midnight or any custom time</li>
                <li>🎨 6 beautiful celebration themes</li>
                <li>📸 Add a personal photo</li>
                <li>💌 Write unlimited custom wishes</li>
                <li>🌍 Works anywhere in the world</li>
                <li>📱 Beautiful on mobile and desktop</li>
              </ul>
              <Link href="/create" className="btn btn--primary btn--lg">
                Create Your Surprise
              </Link>
            </div>

            <div className={styles.previewCard} aria-label="Preview of the surprise countdown experience">
              <div className={styles.previewMockup}>
                <div className={styles.mockupHeader}>
                  <div className={styles.mockupDot} />
                  <div className={styles.mockupDot} />
                  <div className={styles.mockupDot} />
                </div>
                <div className={styles.mockupBody}>
                  <p className={styles.mockupHint}>🎁 You have a surprise waiting...</p>
                  <p className={styles.mockupFor}>For <strong>Priya</strong></p>
                  <div className={styles.mockupCountdown} aria-label="Sample countdown">
                    <div className={styles.mockupUnit}>
                      <span className={styles.mockupDigit}>03</span>
                      <span className={styles.mockupLabel}>Days</span>
                    </div>
                    <span className={styles.mockupColon}>:</span>
                    <div className={styles.mockupUnit}>
                      <span className={styles.mockupDigit}>14</span>
                      <span className={styles.mockupLabel}>Hrs</span>
                    </div>
                    <span className={styles.mockupColon}>:</span>
                    <div className={styles.mockupUnit}>
                      <span className={styles.mockupDigit}>22</span>
                      <span className={styles.mockupLabel}>Min</span>
                    </div>
                    <span className={styles.mockupColon}>:</span>
                    <div className={styles.mockupUnit}>
                      <span className={styles.mockupDigit}>09</span>
                      <span className={styles.mockupLabel}>Sec</span>
                    </div>
                  </div>
                  <p className={styles.mockupTagline}>Open only at midnight 🌙</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className={`section ${styles.testimonialsSection}`} aria-labelledby="testimonials-title">
        <div className="container">
          <header className={styles.sectionHeader}>
            <span className={`badge badge--muted`}>Real love stories</span>
            <h2 id="testimonials-title">Spreading Joy Across Distances</h2>
          </header>

          <ul className={styles.testimonialGrid} role="list">
            {TESTIMONIALS.map((t) => (
              <li key={t.name} className={`card ${styles.testimonialCard}`}>
                <span className={styles.testimonialEmoji} aria-hidden="true">{t.emoji}</span>
                <blockquote className={styles.testimonialQuote}>
                  <p>&ldquo;{t.quote}&rdquo;</p>
                </blockquote>
                <footer className={styles.testimonialAuthor}>
                  <strong>{t.name}</strong>
                  <span>{t.relation}</span>
                </footer>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className={styles.ctaBanner} aria-labelledby="cta-title">
        <div className={`container ${styles.ctaInner}`}>
          <div className={styles.ctaOrb1} aria-hidden="true" />
          <div className={styles.ctaOrb2} aria-hidden="true" />
          <h2 id="cta-title">Ready to Surprise Someone Special?</h2>
          <p>Create a free celebration in minutes. No account needed to get started.</p>
          <Link href="/create" className="btn btn--gold btn--lg">
            Start Creating — It&apos;s Free 🎊
          </Link>
        </div>
      </section>
    </>
  );
}
