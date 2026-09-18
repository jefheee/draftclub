'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-context';
import { Shield, KeyRound, UserCheck, AlertCircle, ArrowRight, Sparkles, LogOut, Loader2 } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';

function LoginFormContent() {
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '';

  const { session, loginAsDemo, loginWithSupabase, logout } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSupabaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor preencha email e senha.');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    const res = await loginWithSupabase(email, password);
    setLoading(false);
    if (res.error) {
      setErrorMsg(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="flex items-center justify-between">
          <BackButton fallbackHref="/" label="Voltar ao Início" />
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
            Autenticação & RBAC
          </span>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-emerald-400">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Acesso ao <span className="text-emerald-400">DraftClub</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Painel exclusivo para Administradores de Ligas e Capitães de Equipe.
          </p>
        </div>

        {/* Notificação se foi redirecionado */}
        {redirectPath && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Você precisa estar autenticado com o cargo apropriado para acessar <code>{redirectPath}</code>.</span>
          </div>
        )}

        {/* Sessão Ativa Atual (se já logado) */}
        {session && (
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-zinc-400">Conectado atualmente como:</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                {session.role}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">{session.name}</p>
              <p className="text-xs text-zinc-500">{session.email}</p>
              {session.teamName && (
                <p className="text-xs text-emerald-400 mt-0.5">Equipe: {session.teamName}</p>
              )}
            </div>
            <div className="flex items-center gap-2 pt-1">
              {session.role === 'admin' && (
                <a
                  href="/admin"
                  className="flex-1 text-center py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-medium text-xs transition-colors"
                >
                  Ir para Painel Admin
                </a>
              )}
              {session.role === 'captain' && (
                <a
                  href="/captain"
                  className="flex-1 text-center py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-medium text-xs transition-colors"
                >
                  Ir para Painel do Capitão
                </a>
              )}
              <button
                onClick={logout}
                className="flex items-center justify-center p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                title="Sair da conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Form Supabase Auth */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-zinc-800/80">
            <KeyRound className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Entrar com Email & Senha
            </h2>
          </div>

          <form onSubmit={handleSupabaseSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              {loading ? 'Validando credenciais...' : 'Acessar Plataforma'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Acesso Rápido de Demonstração / Avaliação */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-zinc-800/80">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Acesso Rápido para Avaliação
            </h2>
          </div>
          <p className="text-xs text-zinc-500">
            Clique para assumir um perfil pré-configurado instantaneamente sem necessidade de confirmação de e-mail:
          </p>

          <div className="grid grid-cols-1 gap-2 pt-1">
            <button
              onClick={() => loginAsDemo('admin')}
              className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-emerald-700/60 hover:bg-zinc-900/60 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-200">Admin Master (Organizador)</p>
                  <p className="text-[11px] text-zinc-500">Criação de ligas, regras e validador de prints</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/30 text-emerald-400 border border-emerald-800/40">
                /admin
              </span>
            </button>

            <button
              onClick={() => loginAsDemo('captain_boca')}
              className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-sky-700/60 hover:bg-zinc-900/60 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-950/40 border border-sky-800/40 flex items-center justify-center text-sky-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-200">Capitão Boca Juniors (buzz)</p>
                  <p className="text-[11px] text-zinc-500">Gestão de elenco e envio de partidas</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-900/30 text-sky-400 border border-sky-800/40">
                /captain
              </span>
            </button>

            <button
              onClick={() => loginAsDemo('captain_river')}
              className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-rose-700/60 hover:bg-zinc-900/60 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-950/40 border border-rose-800/40 flex items-center justify-center text-rose-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-200">Capitão River Plate (Deivy)</p>
                  <p className="text-[11px] text-zinc-500">Gestão de elenco e envio de partidas</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-900/30 text-rose-400 border border-rose-800/40">
                /captain
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 text-zinc-400 flex flex-col items-center justify-center gap-2 text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          <span>Carregando portal de acesso...</span>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
