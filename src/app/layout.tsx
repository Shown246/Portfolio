import type { Metadata } from 'next';
import { Fira_Code } from 'next/font/google';
import './globals.css';
import ParticleBackground from '@/components/ParticleBackground';

const fira = Fira_Code({ subsets: ['latin'], variable: '--font-fira', weight: ['400','500','700'] });

export const metadata: Metadata = {
  title: 'Shihab Shown — Software Developer & AI Engineer',
  description: 'Building intelligent systems, one line at a time.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fira.variable}>
      <body>
        <ParticleBackground />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
