'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { PlayerProfile } from '@/types/database';
import { Users, Search, Award, ArrowRight } from 'lucide-react';
import { getPositionBadgeClass, getArchetypeBadgeClass, cn } from '@/lib/utils';
import { BackButton } from '@/components/ui/back-button';

export default function PlayersIndexPage() {
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const { data, error } = await supabase.from('player_profiles').select('*').order('name');
        if (!error && data) {
          setPlayers(data);
        }
      } catch (e) {
        console.warn('Erro ao carregar lista de atletas:', e);
      }
    }
    fetchPlayers();
  }, []);

  const filteredPlayers = useMemo(() => {
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.archetype && p.archetype.toLowerCase().includes(searchTerm.toLowerCase())) ||
        p.archetypes?.some((a) => a.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [players, searchTerm]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <BackButton fallbackHref="/" label="Home" />
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Scouting Global
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
              Perfis de Jogadores
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Consulte arquétipos, histórico de builds OCR e votos da comunidade.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar atleta ou arquétipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredPlayers.map((player) => (
            <Link
              key={player.id}
              href={`/players/${player.id}`}
              className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl hover:border-zinc-700 transition-colors group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-300">
                    {player.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(player.archetypes && player.archetypes.length > 0 ? player.archetypes : [player.archetype || 'Mágico']).map((arch) => (
                      <span
                        key={arch}
                        className={cn('px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase tracking-wider border', getArchetypeBadgeClass(arch))}
                      >
                        {arch}
                      </span>
                    ))}
                  </div>
                </div>

                <h2 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                  {player.name}
                </h2>

                <div className="flex flex-wrap gap-1 mt-2">
                  {player.positions_declared?.map((pos) => (
                    <span
                      key={pos}
                      className={cn('text-[9px] font-medium px-1.5 py-0.5 rounded border', getPositionBadgeClass(pos))}
                    >
                      {pos}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500 group-hover:text-zinc-300">
                <span>Ver Perfil & Build</span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
