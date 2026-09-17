'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Tournament } from '@/types/database';
import { Trophy, Users, ArrowRight, Shield, Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const FALLBACK_TOURNAMENTS: Tournament[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Liga Argentina Pro Clubs',
    format: '5x5',
    status: 'DRAFT',
    max_teams: 8,
    created_at: '',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Copa dos Libertadores Pro',
    format: '11x11',
    status: 'SCOUTING',
    max_teams: 16,
    created_at: '',
  },
];

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>(FALLBACK_TOURNAMENTS);

  useEffect(() => {
    async function fetchTournaments() {
      try {
        const { data, error } = await supabase.from('tournaments').select('*');
        if (!error && data && data.length > 0) {
          setTournaments(data);
        }
      } catch (err) {
        console.warn('Usando mock de torneios.', err);
      }
    }
    fetchTournaments();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                Multi-Tenant Championships
              </span>
            </div>
            <h1 className="text-3xl font-black text-zinc-50">Campeonatos & Ligas</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Gerencie torneios de 5x5 e 11x11 com draft automático e scout consolidado.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {tournaments.map((tournament) => (
            <div
              key={tournament.id}
              className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-3xl space-y-5 hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-xs uppercase tracking-wider">
                    Formato {tournament.format}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                    Status: {tournament.status}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-zinc-100">{tournament.name}</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Até {tournament.max_teams} equipes participantes. Sistema de Draft e Scouting anônimo ativado.
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-800/60 flex flex-wrap gap-2">
                <Link
                  href={`/tournaments/${tournament.id}/draft`}
                  className="flex-1 min-w-[140px] py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs uppercase tracking-wider text-center transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                  Acessar Draft Board
                </Link>
                <Link
                  href={`/tournaments/${tournament.id}/teams/t1111111-1111-1111-1111-111111111111/builder`}
                  className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase tracking-wider text-center transition-all"
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
