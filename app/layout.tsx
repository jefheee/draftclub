import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DraftClub • EA FC Pro Clubs Scouting & Draft',
  description: 'Sistema anônimo de scouting por pares e draft board para torneio Pro Clubs Liga Argentina.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-zinc-950 text-zinc-50 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
