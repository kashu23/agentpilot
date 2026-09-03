import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AgentPilot — The Command Center for Humans and AI Agents',
  description: 'WebMCP-native collaborative workspace where humans and AI agents share application state, coordinate workflows, and safely hand control back and forth.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-[#F4F6F1] text-zinc-900 antialiased selection:bg-zinc-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}
