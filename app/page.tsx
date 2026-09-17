import Link from 'next/link';
import { 
  Trophy, 
  Users, 
  LayoutGrid, 
  SlidersHorizontal, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Camera 
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[380px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

      <main className="max-w-4xl w-full text-center relative z-10 space-y-10 py-12">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-emerald-400 mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Plataforma Multi-Torneios • 5x5 e 11x11 Pro Clubs
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-zinc-50">
            Draft<span className="text-emerald-400">Club</span> 2.0
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto mt-4 leading-relaxed">
            Ecossistema completo de gestão competitiva de EA FC Pro Clubs: scouting anônimo por pares, leitura OCR de builds, verificação comunitária de posição, draft ao vivo e squad builder tático.
          </p>
        </div>

        {/* Navigation Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {/* Card 1: Torneios */}
          <Link
            href="/tournaments"
            className="group p-5 rounded-3xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/40 hover:bg-zinc-900 transition-all flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                <Trophy className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                Ligas & Torneios
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Multi-tenant: campeonatos 5v5 e 11v11, status de scouting e draft board.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-emerald-400 gap-1">
              <span>Explorar ligas</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Card 2: Perfis e OCR */}
          <Link
            href="/players"
            className="group p-5 rounded-3xl bg-zinc-900/80 border border-zinc-800 hover:border-sky-500/40 hover:bg-zinc-900 transition-all flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-3">
                <Camera className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-zinc-100 group-hover:text-sky-400 transition-colors">
                Perfis & Build OCR
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Upload de fotos de builds, arquétipos e voto na posição real do atleta.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-sky-400 gap-1">
              <span>Ver atletas</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Card 3: Squad Builder */}
          <Link
            href="/tournaments/11111111-1111-1111-1111-111111111111/teams/t1111111-1111-1111-1111-111111111111/builder"
            className="group p-5 rounded-3xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-900 transition-all flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-zinc-100 group-hover:text-amber-400 transition-colors">
                Squad Builder
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Prancheta tática com campinho verde escuro, formações 5v5/11v11 e elenco draftado.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-amber-400 gap-1">
              <span>Montar time</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Card 4: Avaliação Ego-Safe */}
          <Link
            href="/evaluate"
            className="group p-5 rounded-3xl bg-zinc-900/80 border border-zinc-800 hover:border-rose-500/40 hover:bg-zinc-900 transition-all flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-3">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-zinc-100 group-hover:text-rose-400 transition-colors">
                Peer Review
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Avaliação anônima 1-99 de Mecânica, QI e Teamplay gerando Tiers (S, A, B, C, D).
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-rose-400 gap-1">
              <span>Avaliar agora</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        {/* Feature Badges */}
        <div className="pt-6 border-t border-zinc-900 text-xs text-zinc-500 flex flex-wrap items-center justify-center gap-6">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Multi-Tenant & RLS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>OCR de Estilos de Jogo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-sky-400" />
            <span>Community Position Check</span>
          </div>
        </div>
      </main>
    </div>
  );
}
