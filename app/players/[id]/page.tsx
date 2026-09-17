'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Player, PlayerStats } from '@/types/database';
import { BackButton } from '@/components/ui/back-button';
import { PlayerOcrUpload } from '@/components/players/player-ocr-upload';
import { CommunityPositionVote } from '@/components/players/community-position-vote';
import { getEAStatColor, getPositionBadgeClass, cn } from '@/lib/utils';
import { Sparkles, Shield, Activity, Zap, Flame, User, Award } from 'lucide-react';

const FALLBACK_PLAYERS: Record<string, { player: Player; stats: PlayerStats }> = {
  'a0000000-0000-0000-0000-000000000001': {
    player: {
      id: 'a0000000-0000-0000-0000-000000000001',
      name: 'Jefhe',
      declared_positions: ['PE', 'ME', 'ATA', 'MEI', 'VOL'],
      archetype: 'Comandante',
      created_at: '',
    },
    stats: {
      id: 's1',
      player_id: 'a0000000-0000-0000-0000-000000000001',
      pace: 92,
      shooting: 88,
      passing: 91,
      dribbling: 94,
      defending: 76,
      physical: 85,
      updated_at: '',
    },
  },
  'a0000000-0000-0000-0000-000000000002': {
    player: {
      id: 'a0000000-0000-0000-0000-000000000002',
      name: 'buzz',
      declared_positions: ['ATA', 'PE'],
      archetype: 'O Bruxo',
      created_at: '',
    },
    stats: {
      id: 's2',
      player_id: 'a0000000-0000-0000-0000-000000000002',
      pace: 95,
      shooting: 93,
      passing: 84,
      dribbling: 95,
      defending: 45,
      physical: 78,
      updated_at: '',
    },
  },
  'a0000000-0000-0000-0000-000000000003': {
    player: {
      id: 'a0000000-0000-0000-0000-000000000003',
      name: 'JV',
      declared_positions: ['ATA'],
      archetype: 'Predador de Área',
      created_at: '',
    },
    stats: {
      id: 's3',
      player_id: 'a0000000-0000-0000-0000-000000000003',
      pace: 88,
      shooting: 86,
      passing: 78,
      dribbling: 85,
      defending: 42,
      physical: 82,
      updated_at: '',
    },
  },
};

export default function PlayerProfilePage() {
  const params = useParams();
  const playerId = (params?.id as string) || 'a0000000-0000-0000-0000-000000000001';

  const [player, setPlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: pData } = await supabase
          .from('players')
          .select('*')
          .eq('id', playerId)
          .single();

        const { data: sData } = await supabase
          .from('player_stats')
          .select('*')
          .eq('player_id', playerId)
          .single();

        if (pData) setPlayer(pData);
        if (sData) setStats(sData);

        if (!pData && FALLBACK_PLAYERS[playerId]) {
          setPlayer(FALLBACK_PLAYERS[playerId].player);
          setStats(FALLBACK_PLAYERS[playerId].stats);
        } else if (!pData) {
          // Default fallback genérico
          const first = Object.values(FALLBACK_PLAYERS)[0];
          setPlayer(first.player);
          setStats(first.stats);
        }
      } catch (err) {
        const first = Object.values(FALLBACK_PLAYERS)[0];
        setPlayer(first.player);
        setStats(first.stats);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [playerId]);

  if (loading || !player) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400 text-sm">
          <Activity className="w-5 h-5 animate-spin text-emerald-400" />
          <span>Carregando perfil do atleta...</span>
        </div>
      </div>
    );
  }

  const statItems = [
    { label: 'RIT', full: 'Ritmo (Pace)', value: stats?.pace ?? 75 },
    { label: 'FIN', full: 'Finalização (Shooting)', value: stats?.shooting ?? 75 },
    { label: 'PAS', full: 'Passe (Passing)', value: stats?.passing ?? 75 },
    { label: 'CON', full: 'Condução (Dribbling)', value: stats?.dribbling ?? 75 },
    { label: 'DEF', full: 'Defesa (Defending)', value: stats?.defending ?? 75 },
    { label: 'FIS', full: 'Físico (Physical)', value: stats?.physical ?? 75 },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation bar */}
        <div className="flex items-center justify-between">
          <BackButton fallbackHref="/players" label="Voltar aos Jogadores" />
          <span className="text-xs font-mono text-zinc-500">ID: {player.id.slice(0, 8)}</span>
        </div>

        {/* Header do Jogador com Arquétipo & Posições */}
        <div className="bg-zinc-900/90 border border-zinc-800 p-6 rounded-3xl shadow-xl relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-2xl text-emerald-400 shadow-inner">
                {player.name.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold tracking-wider uppercase flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    {player.archetype}
                  </span>
                </div>
                <h1 className="text-3xl font-black text-zinc-50 mt-1">
                  {player.name}
                </h1>
              </div>
            </div>

            {/* Posições Declaradas */}
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5 md:text-right">
                Posições Declaradas
              </span>
              <div className="flex flex-wrap gap-1.5 md:justify-end">
                {player.declared_positions.map((pos) => (
                  <span
                    key={pos}
                    className={cn(
                      'text-xs font-bold px-3 py-1 rounded-lg border',
                      getPositionBadgeClass(pos)
                    )}
                  >
                    {pos}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card de Atributos EA Sports (Padrão de Cores 80+ Verde, 70-79 Amarelo, <70 Vermelho) */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Atributos Base (Estilo EA FC)
            </h2>
            <span className="text-[11px] text-zinc-500 font-mono">
              Verde: 80+ • Amarelo: 70-79 • Vermelho: &lt;70
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {statItems.map((stat) => {
              const colorInfo = getEAStatColor(stat.value);

              return (
                <div
                  key={stat.label}
                  className="bg-zinc-950/80 border border-zinc-800/80 p-4 rounded-2xl flex flex-col items-center text-center group hover:border-zinc-700 transition-colors"
                >
                  <span className="text-[11px] font-bold text-zinc-400 tracking-wider">
                    {stat.label}
                  </span>
                  <div
                    className={cn(
                      'text-3xl font-black font-mono my-1 tracking-tight',
                      colorInfo.text
                    )}
                  >
                    {stat.value}
                  </div>
                  <span className="text-[10px] text-zinc-500 line-clamp-1">
                    {stat.full.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grid com Upload de Build (OCR) e Votação de Posição da Comunidade */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload de Build & Leitura OCR */}
          <PlayerOcrUpload
            playerId={player.id}
            playerName={player.name}
            initialStats={stats}
            onStatsUpdated={(newStats) => setStats(newStats)}
          />

          {/* Votação de Posição Real pela Comunidade */}
          <CommunityPositionVote
            playerId={player.id}
            declaredPositions={player.declared_positions}
          />
        </div>
      </div>
    </div>
  );
}
