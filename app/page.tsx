import Link from 'next/link';
import { 
  Trophy, 
  Users, 
  LayoutGrid, 
  ArrowRight, 
  Shield, 
  Settings,
  UserCheck,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6">
      <main className="max-w-5xl w-full text-center space-y-10 py-12">
        {/* Badge & Titulo */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            SaaS Definitivo para Ligas & Campeonatos de EA FC 26 Pro Clubs
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-100">
            Draft<span className="text-emerald-400">Club</span>
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto mt-3">
            Plataforma escalável e agnóstica para Pro Clubs: controle de acesso RBAC com Supabase Auth, múltiplos arquétipos oficiais, regras dinâmicas, validação de súmulas com prints e squad builder 11v11 oficial.
          </p>
        </div>

        {/* 4 Cards Principais */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-left">
          {/* Card 1: Painel do Capitão */}
          <Link
            href="/captain"
            className="group p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-sky-500/50 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-sky-400 mb-3">
                <UserCheck className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                Painel do Capitão
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Gestão de elenco, múltiplos arquétipos e envio de resultados com print da EA.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-sky-400 group-hover:text-sky-300 gap-1">
              <span>Área do Capitão</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>

          {/* Card 2: Squad Builder 11v11 */}
          <Link
            href="/tournaments/11111111-1111-1111-1111-111111111111/teams/b1111111-1111-1111-1111-111111111111/builder"
            className="group p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-emerald-400 mb-3">
                <LayoutGrid className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                Squad Builder 11v11
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Prancheta tática com formações oficiais EA FC 26 e persistência de escalação.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-emerald-400 group-hover:text-emerald-300 gap-1">
              <span>Prancheta Tática</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>

          {/* Card 3: Draft Board Oficial */}
          <Link
            href="/tournaments/11111111-1111-1111-1111-111111111111/draft"
            className="group p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-amber-400 mb-3">
                <Trophy className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                Sala de Draft & Tiers
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Classificação por Tier (S, A, B, C, D), filtro duplo de posição e escolhas de picks.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-amber-400 group-hover:text-amber-300 gap-1">
              <span>Acessar Draft</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>

          {/* Card 4: Painel Admin Master */}
          <Link
            href="/admin"
            className="group p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-purple-400 mb-3">
                <Settings className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                Painel Master Admin
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Validador de súmulas com prints, regras de Pro Clubs e geração de acessos.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-purple-400 group-hover:text-purple-300 gap-1">
              <span>Gerenciamento</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        </div>

        {/* Banner Informativo de Arquitetura */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-left grid md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1">
            <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Regras Reais de Pro Clubs
            </span>
            <p className="text-zinc-500">
              Crossplay (New-Gen vs Old-Gen), mínimo de humanos em campo e obrigatoriedade de ANY/GK.
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
              Arquétipos Oficiais EA FC 26
            </span>
            <p className="text-zinc-500">
              Suporte a múltiplos estilos (Mágico, Finalizador, Maestro, Criador, Chefia, Muralha...).
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              Validação com Comprovante EA
            </span>
            <p className="text-zinc-500">
              Súmulas enviadas pelos capitães com captura de tela armazenada no Supabase Storage.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
