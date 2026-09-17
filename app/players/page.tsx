'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Player } from '@/types/database';
import { Users, Search, Award, ArrowRight, Sparkles } from 'lucide-react';
import { getPositionBadgeClass, cn } from '@/lib/utils';

const FALLBACK_PLAYERS: Player[] = [
  { id: 'a0000000-0000-0000-0000-000000000001', name: 'Jefhe', declared_positions: ['PE', 'ME', 'ATA', 'MEI', 'VOL'], archetype: 'Comandante', created_at: '' },
  { id: 'a0000000-0000-0000-0000-000000000002', name: 'buzz', declared_positions: ['ATA', 'PE'], archetype: 'O Bruxo', created_at: '' },
  { id: 'a0000000-0000-0000-0000-000000000003', name: 'JV', declared_positions: ['ATA'], archetype: 'Predador de Área', created_at: '' },
  { id: 'a0000000-0000-0000-0000-000000000004', name: 'J4PA', declared_positions: ['MEI'], archetype: 'Maestro', created_at: '' },
  { id: 'a0000000-0000-0000-0000-000000000005', name: 'gustavin171', declared_positions: ['CA', 'ALA'], archetype: 'Velocista', created_at: '' },
  { id: 'a0000000-0000-0000-0000-000000000006', name: 'julião', declared_positions: ['VOL', 'MEI'], archetype: 'Pitbull', created_at: '' },
  { id: 'a0000000-0000-0000-0000-000000000012', name: 'Andrei', declared_positions: ['ZAG', 'VOL'], archetype: 'Muralha', created_at: '' },
  { id: 'a0000000-0000-0000-0000-000000000016', name: 'Miguel', declared_positions: ['GK'], archetype: 'Paredão', created_at: '' },
  { id: 'a0000000-0000-0000-0000-000000000018', name: 'Morges', declared_positions: ['ATA', 'PE', 'PD', 'MEI', 'ME', 'MD'], archetype: 'Mágico', created_at: '' },
];

export default function PlayersIndexPage() {
  const [players, setPlayers] = useState<Player[]>(FALLBACK_PLAYERS);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const { data, error } = await supabase.from('players').select('*').order('name');
        if (!error && data && data.length > 0) {
          setPlayers(data);
        }
      } catch (e) {
        console.warn('Mock de atletas carregado.', e);
      }
    }
    fetchPlayers();
  }, []);

  const filteredPlayers = useMemo(() => {
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.archetype.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [players, searchTerm]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                Scouting Global
              </span>
            </div>
            <h1 className="text-3xl font-black text-zinc-50">Perfis de Jogadores</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Consulte arquétipos, faça upload de prints da build EA FC (OCR) e vote nas posições reais.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome ou arquétipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlayers.map((player) => (
            <Link
              key={player.id}
              href={`/players/${player.id}`}
              className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl hover:border-emerald-500/50 hover:bg-zinc-900 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-sm text-emerald-400">
                    {player.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Award className="w-2.5 h-2.5" />
                    {player.archetype}
                  </span>
                </div>

                <h2 className="text-base font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                  {player.name}
                </h2>

                <div className="flex flex-wrap gap-1 mt-2.5">
                  {player.declared_positions.map((pos) => (
                    <span
                      key={pos}
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded border',
                        getPositionBadgeClass(pos)
                      )}
                    >
                      {pos}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400 group-hover:text-emerald-300 font-medium">
                <span>Ver Perfil & Build OCR</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
