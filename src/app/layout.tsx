import type { Metadata } from 'next';
import { Fira_Code } from 'next/font/google';
import './globals.css';
import ParticleBackground from '@/components/ParticleBackground';
import VisitTracker from '@/components/VisitTracker';
import { alertsEnabled } from '@/lib/visit-alerts';

const fira = Fira_Code({ subsets: ['latin'], variable: '--font-fira', weight: ['400','500','700'] });

export const metadata: Metadata = {
  title: 'Shihab Shown — Software Developer & AI Engineer',
  description: 'Building intelligent systems, one line at a time.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.ico', sizes: 'any' },
    ],
    shortcut: '/icon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fira.variable}>
      <body>
        <VisitTracker enabled={alertsEnabled()} />
        <ParticleBackground />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
