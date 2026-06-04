import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'CelebrateTogether — Virtual Celebrations for Long-Distance Love',
  description:
    'Create beautiful, personalized virtual celebrations for birthdays, anniversaries, baby showers and more. Share a secret countdown link and surprise your loved ones from anywhere in the world.',
  keywords: 'virtual celebration, online birthday, long distance couple, anniversary surprise, countdown reveal',
  openGraph: {
    title: 'CelebrateTogether',
    description: 'Surprise your loved ones with a beautiful virtual celebration.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
