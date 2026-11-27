import './globals.css';
import type { Metadata } from 'next';
import { PlayerProvider } from '@/components/PlayerProvider';

export const metadata: Metadata = {
  title: 'TDH48 Music',
  description: 'The official TDH48 music collection',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <PlayerProvider>{children}</PlayerProvider>
      </body>
    </html>
  );
}
