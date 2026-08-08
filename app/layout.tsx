import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import { AuthProvider } from '@/components/AuthProvider';
import './globals.css';

// Olivera Chic Modern Serif — demo build, personal-use license only.
// See public/fonts/readmedemo.txt. Needs a commercial license from
// creativemarket.com/Pentagonistudio before this ships beyond internal use.
const olivera = localFont({
  src: [
    { path: '../public/fonts/Olivera_Demo.ttf', weight: '400', style: 'normal' },
    { path: '../public/fonts/OliveraObl_Demo.ttf', weight: '400', style: 'italic' },
  ],
  variable: '--font-olivera',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'PVA InfluenceOS — Influencer Collaboration Portal',
  description: 'Track brand campaigns, influencers, and conversation history.',
};

// Every page here is behind auth and reads live Firestore data, so there's
// nothing to gain from static prerendering — and prerendering would run
// Firebase client init at build time, before real env vars exist on Vercel.
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${olivera.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-canvas font-body text-ink antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
