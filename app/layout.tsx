import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/header';
import { AuthProvider } from '@/components/auth/auth-context';

export const metadata: Metadata = {
  title: 'DraftClub • EA FC Pro Clubs Platform',
  description: 'Sistema completo de scouting por pares, upload de build com OCR, draft multi-torneio e squad builder para EA FC Pro Clubs.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-zinc-950 text-zinc-50 antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <Header />
          <div className="flex-1">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
