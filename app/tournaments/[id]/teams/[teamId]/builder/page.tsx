'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { TournamentPlayerStats, FormationKey } from '@/types/database';
import { SquadProvider, useSquad } from '@/components/builder/squad-context';
import { Pitch } from '@/components/builder/pitch';
import { BackButton } from '@/components/ui/back-button';
import { FORMATION_PRESETS, getEAStatColor, getPositionBadgeClass, cn } from '@/lib/utils';
import { 
  Users, 
  Sparkles, 
  RotateCcw, 
  Wand2, 
  CheckCircle, 
  Trophy, 
  SlidersHorizontal,
  ChevronRight,
  Shield,
  Award
} from 'lucide-react';

const FALLBACK_TEAM_PLAYERS: TournamentPlayerStats[] = [
  {
    tournament_id: '11111111-1111-1111-1111-111111111111',
    player_id: 'a0000000-0000-0000-0000-000000000002',
    name: 'buzz',
    archetype: 'O Bruxo',
    declared_positions: ['ATA', 'PE'],
    community_position: 'ATA',
    community_confidence: 88.0,
    total_position_votes: 16,
    is_captain: true,
    evaluation_count: 4,
    avg_mechanic: 95.0,
    avg_iq: 92.0,
    avg_teamplay: 88.0,
    overall_score: 91.7,
    tier: 'S',
    drafted_team_id: 't1111111-1111-1111-1111-111111111111',
    drafted_team_name: 'Boca Juniors FC',
  },
  {
    tournament_id: '11111111-1111-1111-1111-111111111111',
    player_id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Jefhe',
    archetype: 'Comandante',
    declared_positions: ['PE', 'ME', 'ATA', 'MEI', 'VOL'],
    community_position: 'VOL',
    community_confidence: 75.0,
    total_position_votes: 12,
    is_captain: false,
    evaluation_count: 5,
    avg_mechanic: 92.0,
    avg_iq: 93.0,
    avg_teamplay: 91.0,
    overall_score: 92.0,
    tier: 'S',
    drafted_team_id: 't1111111-1111-1111-1111-111111111111',
    drafted_team_name: 'Boca Juniors FC',
  },
  {
    tournament_id: '11111111-1111-1111-1111-111111111111',
    player_id: 'a0000000-0000-0000-0000-000000000006',
    name: 'julião',
    archetype: 'Pitbull',
    declared_positions: ['VOL', 'MEI'],
    community_position: 'VOL',
    community_confidence: 85.0,
    total_position_votes: 6,
    is_captain: false,
    evaluation_count: 3,
    avg_mechanic: 78.0,
    avg_iq: 76.0,
    avg_teamplay: 79.0,
    overall_score: 77.7,
    tier: 'B',
    drafted_team_id: 't1111111-1111-1111-1111-111111111111',
    drafted_team_name: 'Boca Juniors FC',
  },
  {
    tournament_id: '11111111-1111-1111-1111-111111111111',
    player_id: 'a0000000-0000-0000-0000-000000000016',
    name: 'Miguel',
    archetype: 'Paredão',
    declared_positions: ['GK'],
    community_position: 'GK',
    community_confidence: 96.0,
    total_position_votes: 10,
    is_captain: false,
    evaluation_count: 3,
    avg_mechanic: 86.0,
    avg_iq: 88.0,
    avg_teamplay: 87.0,
    overall_score: 87.0,
    tier: 'A',
    drafted_team_id: 't1111111-1111-1111-1111-111111111111',
    drafted_team_name: 'Boca Juniors FC',
  },
  {
    tournament_id: '11111111-1111-1111-1111-111111111111',
    player_id: 'a0000000-0000-0000-0000-000000000018',
    name: 'Morges',
    archetype: 'Mágico',
    declared_positions: ['ATA', 'PE', 'PD', 'MEI', 'ME', 'MD'],
    community_position: 'MEI',
    community_confidence: 70.0,
    total_position_votes: 8,
    is_captain: false,
    evaluation_count: 3,
    avg_mechanic: 90.0,
    avg_iq: 89.0,
    avg_teamplay: 91.0,
    overall_score: 90.0,
    tier: 'S',
    drafted_team_id: 't1111111-1111-1111-1111-111111111111',
    drafted_team_name: 'Boca Juniors FC',
  },
];

function SquadBuilderContent() {
  const params = useParams();
  const tournamentId = (params?.id as string) || '11111111-1111-1111-1111-111111111111';
  const teamId = (params?.teamId as string) || 't1111111-1111-1111-1111-111111111111';

  const [teamRoster, setTeamRoster] = useState<TournamentPlayerStats[]>(FALLBACK_TEAM_PLAYERS);
  const [teamName, setTeamName] = useState('Boca Juniors FC');

  const {
    formation,
    setFormation,
    slots,
    assignments,
    selectedBenchPlayer,
    setSelectedBenchPlayer,
    autoAssignSquad,
    clearPitch,
    isPlayerOnPitch,
  } = useSquad();

  useEffect(() => {
    async function loadTeamData() {
      try {
        const { data: teamData } = await supabase
          .from('teams')
          .select('name')
          .eq('id', teamId)
          .single();

        if (teamData) setTeamName(teamData.name);

        const { data: statsData } = await supabase
          .from('vw_tournament_player_stats')
          .select('*')
          .eq('tournament_id', tournamentId)
          .eq('drafted_team_id', teamId);

        if (statsData && statsData.length > 0) {
          setTeamRoster(statsData as TournamentPlayerStats[]);
        }
      } catch (err) {
        console.warn('Fallback roster local ativo.', err);
      }
    }
    loadTeamData();
  }, [tournamentId, teamId]);

  // Estatísticas do Time Escalado
  const squadMetrics = useMemo(() => {
    const assignedPlayers = Object.values(assignments).filter(
      (p): p is TournamentPlayerStats => p !== null
    );
    const count = assignedPlayers.length;
    const totalSlots = slots.length;
    const avgOverall =
      count > 0
        ? Math.round(
            (assignedPlayers.reduce((acc, p) => acc + (p.overall_score || 75), 0) / count) * 10
          ) / 10
        : 0;

    return { count, totalSlots, avgOverall };
  }, [assignments, slots]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation & Team Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BackButton fallbackHref={`/tournaments/${tournamentId}/draft`} label="Voltar ao Draft" />
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                Prancheta Tática
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-50 flex items-center gap-2">
              Squad Builder <span className="text-emerald-400 font-mono text-xl md:text-2xl font-normal">/ {teamName}</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Monte sua escalação tática com os atletas draftados e visualize o balanceamento em campo.
            </p>
          </div>

          {/* Quick Stats Bar */}
          <div className="flex items-center gap-3 bg-zinc-900/80 border border-zinc-800 p-3 rounded-2xl">
            <div className="px-3 border-r border-zinc-800 text-center">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Titulares</span>
              <span className="text-lg font-black font-mono text-emerald-400">
                {squadMetrics.count}/{squadMetrics.totalSlots}
              </span>
            </div>
            <div className="px-3 text-center">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Overall Médio</span>
              <span className="text-lg font-black font-mono text-zinc-100">
                {squadMetrics.avgOverall > 0 ? squadMetrics.avgOverall : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Tactical Controls & Formation Selector */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Esquema Tático:
            </label>
            <select
              value={formation}
              onChange={(e) => setFormation(e.target.value as FormationKey)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
            >
              <optgroup label="Formatos 5x5">
                <option value="1-2-1">1-2-1 Losango (5x5)</option>
                <option value="2-2">2-2 Quadrado (5x5)</option>
              </optgroup>
              <optgroup label="Formatos 11x11">
                <option value="4-3-3">4-3-3 Clássico (11x11)</option>
                <option value="4-2-3-1">4-2-3-1 Moderno (11x11)</option>
                <option value="3-5-2">3-5-2 Ofensivo (11x11)</option>
              </optgroup>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => autoAssignSquad(teamRoster)}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Auto-Escalar</span>
            </button>

            <button
              onClick={clearPitch}
              className="px-3.5 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          </div>
        </div>

        {/* Core Layout: Tactical Pitch + Lateral Bench */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Tactical Pitch (Colunas 7) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            {selectedBenchPlayer && (
              <div className="mb-3 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold animate-pulse flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Clique em qualquer posição no campo para escalar <strong>{selectedBenchPlayer.name}</strong></span>
              </div>
            )}
            <Pitch />
          </div>

          {/* Lateral Bench / Elenco Draftado (Colunas 5) */}
          <div className="lg:col-span-5 bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Elenco Draftado ({teamRoster.length})
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Selecione um atleta e clique na posição do campo desejada.
                </p>
              </div>
            </div>

            {/* Lista dos Jogadores do Time */}
            <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
              {teamRoster.map((player) => {
                const onPitch = isPlayerOnPitch(player.player_id);
                const isSelected = selectedBenchPlayer?.player_id === player.player_id;
                const statColor = getEAStatColor(player.overall_score || 75);

                return (
                  <div
                    key={player.player_id}
                    onClick={() => setSelectedBenchPlayer(isSelected ? null : player)}
                    className={cn(
                      'p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group',
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : onPitch
                        ? 'bg-zinc-950/40 border-zinc-850 opacity-75'
                        : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Overall Badge */}
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center font-black font-mono text-sm border',
                          statColor.badge
                        )}
                      >
                        {player.overall_score > 0 ? player.overall_score : '75'}
                      </div>

                      {/* Nome e Arquétipo */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                            {player.name}
                          </span>
                          {player.is_captain && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Capitão
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                          <Award className="w-2.5 h-2.5 text-amber-400" />
                          {player.archetype}
                        </span>
                      </div>
                    </div>

                    {/* Status e Posições */}
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex gap-1">
                        {player.declared_positions.slice(0, 2).map((pos) => (
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

                      {onPitch ? (
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Em Campo
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300">
                          {isSelected ? 'Posicionar ↵' : 'Disponível'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeamSquadBuilderPage() {
  return (
    <SquadProvider initialFormation="1-2-1">
      <SquadBuilderContent />
    </SquadProvider>
  );
}
