import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const siteUrl = 'https://agentpilot.openai.site';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'AgentPilot — Human + AI Command Center',
  description: 'The command center where humans and AI agents work together.',
  openGraph: { title: 'AgentPilot', description: 'Humans and AI, in command together.', images: [{ url: '/og.png', width: 1536, height: 1024, alt: 'AgentPilot human and AI command center' }] },
  twitter: { card: 'summary_large_image', title: 'AgentPilot', description: 'Humans and AI, in command together.', images: ['/og.png'] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body></html>;
}
