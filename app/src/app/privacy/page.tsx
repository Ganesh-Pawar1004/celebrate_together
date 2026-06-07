export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '8rem 2rem 4rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
      <h1 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Privacy Policy</h1>
      <p style={{ marginBottom: '1rem' }}>Last updated: June 7, 2026</p>
      <p style={{ marginBottom: '1.5rem' }}>
        CelebrateTogether values your privacy. This policy details how we handle information when you create or participate in virtual celebrations.
      </p>
      
      <h2 style={{ color: 'var(--text-primary)', marginTop: '2rem', marginBottom: '1rem' }}>1. Information We Collect</h2>
      <p style={{ marginBottom: '1rem' }}>
        We only collect the details you explicitly provide to generate your celebrations: recipient names, sender names, custom messages, photos (up to 4), and background music selections.
      </p>

      <h2 style={{ color: 'var(--text-primary)', marginTop: '2rem', marginBottom: '1rem' }}>2. Data Storage & Sharing</h2>
      <p style={{ marginBottom: '1rem' }}>
        Celebrations and uploaded assets are securely stored inside our Supabase database and storage buckets. They are accessible only to people you share your unique celebration link with.
      </p>

      <h2 style={{ color: 'var(--text-primary)', marginTop: '2rem', marginBottom: '1rem' }}>3. Cookies & LocalStorage</h2>
      <p style={{ marginBottom: '1rem' }}>
        We use local browser storage to save your celebration details in demo mode and to authenticate logged-in creators. No tracking cookies are used.
      </p>
    </div>
  );
}
