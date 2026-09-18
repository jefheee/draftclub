'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DraftBoardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/tournaments/11111111-1111-1111-1111-111111111111/draft');
  }, [router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-zinc-400">
      <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
      <p className="text-sm">Redirecionando para a Sala de Draft oficial...</p>
    </div>
  );
}
