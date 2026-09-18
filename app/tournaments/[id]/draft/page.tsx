'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { TournamentPlayerStats } from '@/types/database';
import { BackButton } from '@/components/ui/back-button';
import { TIER_MAP, getPositionBadgeClass, cn } from '@/lib/utils';
import { Search, Crown, ArrowUpDown, Award, AlertTriangle, Shield, Check } from 'lucide-react';

type SortField = 'overall' | 'mechanic' | 'iq' | 'teamplay' | 'votes' | 'name';
type SortDirection = 'asc' | 'desc';
type PositionFilterMode = 'declared' | 'community';

export default function TournamentDraftPage() {
  const params = useParams();
  const tournamentId = (params?.id as string) || '11111111-1111-1111-1111-111111111111';

  const [stats, setStats] = useState<TournamentPlayerStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilterMode, setPositionFilterMode] = useState<PositionFilterMode>('declared');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [sortField, setSortField] = useState<SortField>('overall');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase
          .from('vw_tournament_player_stats')
          .select('*')
          .eq('tournament_id', tournamentId);

        if (!error && data) {
          setStats(data as TournamentPlayerStats[]);
        }
      } catch (err) {
        console.warn('Erro ao carregar draft board:', err);
      }
    }
    loadData();
  }, [tournamentId]);

  const availablePositions = useMemo(() => {
    const posSet = new Set<string>();
    stats.forEach((p) => {
      p.positions_declared?.forEach((pos) => posSet.add(pos.trim().toUpperCase()));
      if (p.community_position) posSet.add(p.community_position.trim().toUpperCase());
    });
    return Array.from(posSet).sort();
  }, [stats]);

  const filteredAndSorted = useMemo(() => {
    return stats
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.archetype.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesPosition = true;
        if (selectedPosition !== 'ALL') {
          if (positionFilterMode === 'declared') {
            matchesPosition = p.positions_declared?.some(
              (pos) => pos.trim().toUpperCase() === selectedPosition
            );
          } else {
            matchesPosition = p.community_position?.trim().toUpperCase() === selectedPosition;
          }
        }

        const matchesTier = selectedTier === 'ALL' || p.tier === selectedTier;
        const matchesAvailability = !onlyAvailable || !p.drafted_team_id;

        return matchesSearch && matchesPosition && matchesTier && matchesAvailability;
      })
      .sort((a, b) => {
        let valA: any = a[sortField === 'votes' ? 'evaluation_count' : sortField === 'overall' ? 'overall_score' : 'name'];
        let valB: any = b[sortField === 'votes' ? 'evaluation_count' : sortField === 'overall' ? 'overall_score' : 'name'];

        if (sortField === 'mechanic') {
          valA = a.avg_mechanic;
          valB = b.avg_mechanic;
        } else if (sortField === 'iq') {
          valA = a.avg_iq;
          valB = b.avg_iq;
        } else if (sortField === 'teamplay') {
          valA = a.avg_teamplay;
          valB = b.avg_teamplay;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [stats, searchTerm, selectedPosition, positionFilterMode, selectedTier, onlyAvailable, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleDraftToggle = async (playerId: string) => {
    const targetPlayer = stats.find((p) => p.player_id === playerId);
    if (!targetPlayer) return;

    const isCurrentlyDrafted = !!targetPlayer.drafted_team_id;

    if (isCurrentlyDrafted) {
      await supabase
        .from('draft_picks')
        .delete()
        .eq('tournament_id', tournamentId)
        .eq('player_id', playerId);

      setStats((prev) =>
        prev.map((p) =>
          p.player_id === playerId
            ? { ...p, drafted_team_id: null, drafted_team_name: null }
            : p
        )
      );
    } else {
      const defaultTeamId = 'b1111111-1111-1111-1111-111111111111';
      await supabase.from('draft_picks').upsert({
        tournament_id: tournamentId,
        team_id: defaultTeamId,
        player_id: playerId,
        round: 1,
        pick_number: 1,
      });

      setStats((prev) =>
        prev.map((p) =>
          p.player_id === playerId
            ? { ...p, drafted_team_id: defaultTeamId, drafted_team_name: 'Boca Juniors FC' }
            : p
        )
      );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Minimalista */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <BackButton fallbackHref="/tournaments" label="Torneios" />
              <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                Sessão de Draft
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
              Draft Board dos Capitães
            </h1>
          </div>

          <Link
            href={`/tournaments/${tournamentId}/teams/b1111111-1111-1111-1111-111111111111/builder`}
            className="py-2 px-3.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
          >
            <span>Ir para Squad Builder</span>
          </Link>
        </div>

        {/* Barra de Filtros Minimalista */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-3">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por atleta ou arquétipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>

            {/* Alternador de Modo de Posição */}
            <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
              <button
                onClick={() => setPositionFilterMode('declared')}
                className={cn(
                  'px-3 py-1 rounded-md transition-colors font-medium',
                  positionFilterMode === 'declared'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                Posição Declarada
              </button>
              <button
                onClick={() => setPositionFilterMode('community')}
                className={cn(
                  'px-3 py-1 rounded-md transition-colors font-medium',
                  positionFilterMode === 'community'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                Posição da Comunidade
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-zinc-800/60">
            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs">
              <span className="text-zinc-500">Posição:</span>
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="bg-transparent text-zinc-200 font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-zinc-900">Todas</option>
                {availablePositions.map((pos) => (
                  <option key={pos} value={pos} className="bg-zinc-900">{pos}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs">
              <span className="text-zinc-500">Tier:</span>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="bg-transparent text-zinc-200 font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-zinc-900">Todos</option>
                <option value="S" className="bg-zinc-900">Tier S (90+)</option>
                <option value="A" className="bg-zinc-900">Tier A (80-89)</option>
                <option value="B" className="bg-zinc-900">Tier B (70-79)</option>
                <option value="C" className="bg-zinc-900">Tier C (60-69)</option>
                <option value="D" className="bg-zinc-900">Tier D (&lt;60)</option>
              </select>
            </div>

            <button
              onClick={() => setOnlyAvailable((prev) => !prev)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium border transition-colors',
                onlyAvailable ? 'bg-zinc-800 text-zinc-200 border-zinc-700' : 'bg-zinc-950 text-zinc-400 border-zinc-800'
              )}
            >
              Apenas Não-Draftados
            </button>
          </div>
        </div>

        {/* Tabela do Draft Minimalista */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/60 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3 cursor-pointer hover:text-zinc-200" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      <span>Jogador</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Posição Declarada</th>
                  <th className="py-3 px-3">Voto da Comunidade</th>
                  <th className="py-3 px-3 text-center">Tier</th>
                  <th className="py-3 px-3 text-center cursor-pointer hover:text-zinc-200" onClick={() => handleSort('overall')}>
                    <div className="flex items-center justify-center gap-1">
                      <span>Overall</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center hidden md:table-cell" onClick={() => handleSort('mechanic')}>MEC</th>
                  <th className="py-3 px-3 text-center hidden md:table-cell" onClick={() => handleSort('iq')}>QI</th>
                  <th className="py-3 px-3 text-center hidden md:table-cell" onClick={() => handleSort('teamplay')}>TMP</th>
                  <th className="py-3 px-3 text-center" onClick={() => handleSort('votes')}>Votos</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 font-normal">
                {filteredAndSorted.map((player, index) => {
                  const tierInfo = TIER_MAP[player.tier];
                  const isDrafted = !!player.drafted_team_id;
                  const hasDivergence =
                    player.community_position &&
                    !player.positions_declared?.includes(player.community_position);

                  return (
                    <tr
                      key={player.player_id}
                      className={cn('hover:bg-zinc-950/40 transition-colors', isDrafted && 'opacity-40')}
                    >
                      <td className="py-3 px-3 font-mono text-zinc-500">{String(index + 1).padStart(2, '0')}</td>
                      <td className="py-3 px-3">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Link href={`/players/${player.player_id}`} className="font-semibold text-zinc-200 hover:text-white">
                              {player.name}
                            </Link>
                            {player.is_captain && (
                              <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-950/40 text-amber-300 border border-amber-800/60">
                                <Crown className="w-2.5 h-2.5" /> Capitão
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                            <Award className="w-2.5 h-2.5 text-zinc-600" /> {player.archetype}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {player.positions_declared?.map((pos) => (
                            <span key={pos} className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded border', getPositionBadgeClass(pos))}>
                              {pos}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded border', getPositionBadgeClass(player.community_position))}>
                            {player.community_position}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">{player.community_confidence}%</span>
                          {hasDivergence && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={cn('inline-block px-2 py-0.5 rounded text-[10px] font-bold border', tierInfo.badgeClass)}>
                          {player.tier}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-bold font-mono text-sm text-zinc-100">
                        {player.overall_score > 0 ? player.overall_score : '—'}
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-zinc-400 hidden md:table-cell">{player.avg_mechanic > 0 ? player.avg_mechanic : '—'}</td>
                      <td className="py-3 px-3 text-center font-mono text-zinc-400 hidden md:table-cell">{player.avg_iq > 0 ? player.avg_iq : '—'}</td>
                      <td className="py-3 px-3 text-center font-mono text-zinc-400 hidden md:table-cell">{player.avg_teamplay > 0 ? player.avg_teamplay : '—'}</td>
                      <td className="py-3 px-3 text-center font-mono text-zinc-400">{player.evaluation_count}</td>

                      <td className="py-3 px-3 text-right">
                        {isDrafted ? (
                          <button
                            onClick={() => handleDraftToggle(player.player_id)}
                            className="text-[10px] font-medium px-2 py-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-rose-800 hover:text-rose-300 transition-colors"
                          >
                            {player.drafted_team_name}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDraftToggle(player.player_id)}
                            className="text-[10px] font-semibold px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition-colors"
                          >
                            Draftar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
