export default function TermsPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '8rem 2rem 4rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
      <h1 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Terms of Service</h1>
      <p style={{ marginBottom: '1rem' }}>Last updated: June 7, 2026</p>
      <p style={{ marginBottom: '1.5rem' }}>
        By using CelebrateTogether, you agree to these terms.
      </p>
      
      <h2 style={{ color: 'var(--text-primary)', marginTop: '2rem', marginBottom: '1rem' }}>1. Usage Rights</h2>
      <p style={{ marginBottom: '1rem' }}>
        You retain all rights to the photos and text messages you upload to create celebrations. You are responsible for ensuring you have permission to use any custom audio files you upload.
      </p>

      <h2 style={{ color: 'var(--text-primary)', marginTop: '2rem', marginBottom: '1rem' }}>2. Acceptable Conduct</h2>
      <p style={{ marginBottom: '1rem' }}>
        You agree not to use the platform to create content that is abusive, harassing, illegal, or violates the rights of others. We reserve the right to deactivate any celebrations that violate these terms.
      </p>

      <h2 style={{ color: 'var(--text-primary)', marginTop: '2rem', marginBottom: '1rem' }}>3. Service Availability</h2>
      <p style={{ marginBottom: '1rem' }}>
        CelebrateTogether is provided "as is". We aim to keep your celebrations active, but do not guarantee 100% uptime or permanent storage of assets.
      </p>
    </div>
  );
}
