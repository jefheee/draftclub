import Link from 'next/link';
import { ShieldCheck, Users, Trophy, SlidersHorizontal, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <main className="max-w-xl w-full text-center relative z-10 space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-emerald-400 mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Torneio EA FC Pro Clubs 5v5 • Liga Argentina
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-50">
            Draft<span className="text-emerald-400">Club</span>
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base mt-3">
            Scouting anônimo por pares e gerenciamento estratégico de Draft para balanceamento competitivo.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-left">
          <Link
            href="/evaluate"
            className="group p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-emerald-500/40 hover:bg-zinc-900 transition-all shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                Avaliar Jogadores
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Envio ego-safe 100% anônimo baseado em Mecânica, QI e Teamplay.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-emerald-400 gap-1">
              <span>Acessar formulário</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/draft-board"
            className="group p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-900 transition-all shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
                <Trophy className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-zinc-100 group-hover:text-amber-400 transition-colors">
                Draft Board
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Dashboard exclusivo para os 8 Capitães com Tier List, filtros e ranking consolidado.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-amber-400 gap-1">
              <span>Abrir dashboard</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        <div className="pt-4 border-t border-zinc-900 text-xs text-zinc-500 flex items-center justify-center gap-6">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>40 Jogadores</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Ego-Safe</span>
          </div>
        </div>
      </main>
    </div>
  );
}
