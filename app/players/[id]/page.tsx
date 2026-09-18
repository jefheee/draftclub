'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PlayerProfile, PlayerStats } from '@/types/database';
import { BackButton } from '@/components/ui/back-button';
import { PlayerOcrUpload } from '@/components/players/player-ocr-upload';
import { CommunityPositionVote } from '@/components/players/community-position-vote';
import { getEAStatColor, getPositionBadgeClass, getArchetypeBadgeClass, cn } from '@/lib/utils';
import { Activity, Award, User } from 'lucide-react';

export default function PlayerProfilePage() {
  const params = useParams();
  const playerId = (params?.id as string) || 'a0000000-0000-0000-0000-000000000001';

  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: pData } = await supabase.from('player_profiles').select('*').eq('id', playerId).single();
        const { data: sData } = await supabase.from('player_stats').select('*').eq('player_id', playerId).single();

        if (pData) setPlayer(pData);
        if (sData) setStats(sData);
      } catch (e) {
        console.warn('Erro ao carregar perfil:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [playerId]);

  if (loading || !player) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <Activity className="w-5 h-5 animate-spin text-zinc-500" />
      </div>
    );
  }

  const statItems = [
    { label: 'RIT', full: 'Ritmo', value: stats?.pace ?? 75 },
    { label: 'FIN', full: 'Finalização', value: stats?.shooting ?? 75 },
    { label: 'PAS', full: 'Passe', value: stats?.passing ?? 75 },
    { label: 'CON', full: 'Condução', value: stats?.dribbling ?? 75 },
    { label: 'DEF', full: 'Defesa', value: stats?.defending ?? 75 },
    { label: 'FIS', full: 'Físico', value: stats?.physical ?? 75 },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <BackButton fallbackHref="/players" label="Voltar aos Jogadores" />
          <span className="text-[11px] font-mono text-zinc-600">ID: {player.id.slice(0, 8)}</span>
        </div>

        {/* Card Header do Atleta Minimalista */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center font-bold text-lg text-zinc-200">
                {player.name.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(player.archetypes && player.archetypes.length > 0 ? player.archetypes : [player.archetype || 'Mágico']).map((arch) => (
                    <span
                      key={arch}
                      className={cn('px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border flex items-center gap-1', getArchetypeBadgeClass(arch))}
                    >
                      <Award className="w-3 h-3" />
                      {arch}
                    </span>
                  ))}
                </div>
                <h1 className="text-2xl font-bold text-zinc-100 mt-1">{player.name}</h1>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 block mb-1 md:text-right">
                Posições Declaradas
              </span>
              <div className="flex flex-wrap gap-1 md:justify-end">
                {player.positions_declared?.map((pos) => (
                  <span key={pos} className={cn('text-xs font-medium px-2 py-0.5 rounded border', getPositionBadgeClass(pos))}>
                    {pos}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Atributos EA Sports Minimalistas */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Atributos Base (EA FC)
            </h2>
            <span className="text-[10px] text-zinc-500 font-mono">
              Verde: 80+ • Âmbar: 70-79 • Neutro: &lt;70
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {statItems.map((stat) => {
              const colorInfo = getEAStatColor(stat.value);

              return (
                <div
                  key={stat.label}
                  className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl flex flex-col items-center text-center"
                >
                  <span className="text-[10px] font-semibold text-zinc-500">{stat.label}</span>
                  <div className={cn('text-2xl font-bold font-mono my-0.5 tracking-tight', colorInfo.text)}>
                    {stat.value}
                  </div>
                  <span className="text-[9px] text-zinc-500">{stat.full}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upload de Build (OCR) e Votação de Posição Real */}
        <div className="grid md:grid-cols-2 gap-5">
          <PlayerOcrUpload
            playerId={player.id}
            playerName={player.name}
            initialStats={stats}
            onStatsUpdated={(newStats) => setStats(newStats)}
          />

          <CommunityPositionVote
            playerId={player.id}
            declaredPositions={player.positions_declared}
          />
        </div>
      </div>
    </div>
  );
}
