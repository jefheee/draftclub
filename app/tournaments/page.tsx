'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Tournament } from '@/types/database';
import { Trophy, Users, ArrowRight, Shield } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    async function fetchTournaments() {
      try {
        const { data, error } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          setTournaments(data);
        }
      } catch (err) {
        console.warn('Erro ao buscar torneios:', err);
      }
    }
    fetchTournaments();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <BackButton fallbackHref="/" label="Home" />
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Campeonatos Ativos
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
              Ligas & Torneios (11v11)
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Selecione o campeonato para acessar o Draft Board ou gerenciar táticas no Squad Builder.
            </p>
          </div>

          <Link
            href="/admin"
            className="py-2 px-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-medium transition-colors"
          >
            + Criar Novo Torneio
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {tournaments.map((tournament) => (
            <div
              key={tournament.id}
              className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">
                    Formato {tournament.format}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">
                    Status: {tournament.status}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-zinc-100">{tournament.name}</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Draft ao vivo, scout consolidado com peer review e prancheta de 11 atletas.
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-800/60 flex items-center gap-2">
                <Link
                  href={`/tournaments/${tournament.id}/draft`}
                  className="flex-1 py-2 px-3 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs text-center transition-colors"
                >
                  Draft Board
                </Link>
                <Link
                  href={`/tournaments/${tournament.id}/teams/b1111111-1111-1111-1111-111111111111/builder`}
                  className="py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs text-center transition-colors"
                >
                  Squad Builder
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
