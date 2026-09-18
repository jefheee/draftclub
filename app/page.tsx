import Link from 'next/link';
import { 
  Trophy, 
  Users, 
  LayoutGrid, 
  SlidersHorizontal, 
  ArrowRight, 
  Shield, 
  Settings 
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6">
      <main className="max-w-4xl w-full text-center space-y-10 py-12">
        {/* Badge & Titulo */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            SaaS de Scouting & Gerenciamento de Draft (11v11)
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-100">
            Draft<span className="text-emerald-400">Club</span>
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto mt-3">
            Plataforma escalável para campeonatos de EA FC Pro Clubs: controle de acesso RBAC, scout por pares anônimo, extração OCR de builds e prancheta tática oficial.
          </p>
        </div>

        {/* 4 Cards Principais */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-left">
          <Link
            href="/tournaments"
            className="group p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-300 mb-3">
                <Trophy className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                Ligas & Torneios
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Visualização de torneios ativos, status de scouting e draft board.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-zinc-400 group-hover:text-zinc-200 gap-1">
              <span>Acessar</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>

          <Link
            href="/tournaments/11111111-1111-1111-1111-111111111111/teams/b1111111-1111-1111-1111-111111111111/builder"
            className="group p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-300 mb-3">
                <LayoutGrid className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                Squad Builder 11v11
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Prancheta tática com formações oficiais EA FC 26 e persistência de escalação.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-zinc-400 group-hover:text-zinc-200 gap-1">
              <span>Montar time</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>

          <Link
            href="/players"
            className="group p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-300 mb-3">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                Perfis & OCR
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Arquétipos, upload de screenshots de builds e voto na posição real.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-zinc-400 group-hover:text-zinc-200 gap-1">
              <span>Ver atletas</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>

          <Link
            href="/admin"
            className="group p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-300 mb-3">
                <Settings className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                Painel Admin
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Criar torneios, gerenciar atletas e atribuir capitães por campeonato.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-zinc-400 group-hover:text-zinc-200 gap-1">
              <span>Gerenciar</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        </div>

        {/* Footer Minimalista */}
        <div className="pt-6 border-t border-zinc-900 text-xs text-zinc-500 flex items-center justify-center gap-6">
          <span>Multi-Tenant</span>
          <span>•</span>
          <span>11v11 EA FC Formations</span>
          <span>•</span>
          <span>Role-Based Access Control (RBAC)</span>
        </div>
      </main>
    </div>
  );
}
