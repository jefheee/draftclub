'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { TournamentPlayerStats, Tier } from '@/types/database';
import { BackButton } from '@/components/ui/back-button';
import { TIER_MAP, getPositionBadgeClass, cn } from '@/lib/utils';
import { 
  Search, 
  Crown, 
  TrendingUp, 
  Users, 
  ShieldCheck, 
  ArrowUpDown, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

const FALLBACK_TOURNAMENT_STATS: TournamentPlayerStats[] = [
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
    draft_round: 2,
    draft_pick_number: 6,
  },
  {
    tournament_id: '11111111-1111-1111-1111-111111111111',
    player_id: 'a0000000-0000-0000-0000-000000000002',
    name: 'buzz',
    archetype: 'O Bruxo',
    declared_positions: ['ATA', 'PE'],
    community_position: 'ATA',
    community_confidence: 88.5,
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
    draft_round: 1,
    draft_pick_number: 1,
  },
  {
    tournament_id: '11111111-1111-1111-1111-111111111111',
    player_id: 'a0000000-0000-0000-0000-000000000018',
    name: 'Morges',
    archetype: 'Mágico',
    declared_positions: ['ATA', 'PE', 'PD', 'MEI', 'ME', 'MD'],
    community_position: 'MEI',
    community_confidence: 65.0,
    total_position_votes: 8,
    is_captain: false,
    evaluation_count: 3,
    avg_mechanic: 90.0,
    avg_iq: 89.0,
    avg_teamplay: 91.0,
    overall_score: 90.0,
    tier: 'S',
    drafted_team_id: null,
  },
  {
    tournament_id: '11111111-1111-1111-1111-111111111111',
    player_id: 'a0000000-0000-0000-0000-000000000004',
    name: 'J4PA',
    archetype: 'Maestro',
    declared_positions: ['MEI'],
    community_position: 'MEI',
    community_confidence: 94.0,
    total_position_votes: 10,
    is_captain: false,
    evaluation_count: 4,
    avg_mechanic: 89.0,
    avg_iq: 91.0,
    avg_teamplay: 88.0,
    overall_score: 89.3,
    tier: 'A',
    drafted_team_id: null,
  },
  {
    tournament_id: '11111111-1111-1111-1111-111111111111',
    player_id: 'a0000000-0000-0000-0000-000000000019',
    name: 'Ribeiro',
    archetype: 'Torre',
    declared_positions: ['ZAG', 'VOL', 'MC'],
    community_position: 'ZAG',
    community_confidence: 82.0,
    total_position_votes: 9,
    is_captain: false,
    evaluation_count: 3,
    avg_mechanic: 88.0,
    avg_iq: 90.0,
    avg_teamplay: 87.0,
    overall_score: 88.3,
    tier: 'A',
    drafted_team_id: null,
  },
  {
    tournament_id: '11111111-1111-1111-1111-111111111111',
    player_id: 'a0000000-0000-0000-0000-000000000003',
    name: 'JV',
    archetype: 'Predador de Área',
    declared_positions: ['ATA'],
    community_position: 'ATA',
    community_confidence: 90.0,
    total_position_votes: 7,
    is_captain: false,
    evaluation_count: 5,
    avg_mechanic: 83.0,
    avg_iq: 84.0,
    avg_teamplay: 83.0,
    overall_score: 83.3,
    tier: 'A',
    drafted_team_id: null,
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
    draft_round: 3,
    draft_pick_number: 7,
  },
];

type SortField = 'overall' | 'mechanic' | 'iq' | 'teamplay' | 'votes' | 'name';
type SortDirection = 'asc' | 'desc';
type PositionFilterMode = 'declared' | 'community';

export default function TournamentDraftPage() {
  const params = useParams();
  const tournamentId = (params?.id as string) || '11111111-1111-1111-1111-111111111111';

  const [stats, setStats] = useState<TournamentPlayerStats[]>(FALLBACK_TOURNAMENT_STATS);
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

        if (!error && data && data.length > 0) {
          setStats(data as TournamentPlayerStats[]);
        }
      } catch (err) {
        console.warn('Fallback mock para o torneio.', err);
      }
    }
    loadData();
  }, [tournamentId]);

  const availablePositions = useMemo(() => {
    const posSet = new Set<string>();
    stats.forEach((p) => {
      p.declared_positions?.forEach((pos) => posSet.add(pos.trim().toUpperCase()));
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
            matchesPosition = p.declared_positions.some(
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

  const handleDraftToggle = (playerId: string) => {
    setStats((prev) =>
      prev.map((p) => {
        if (p.player_id === playerId) {
          const isCurrentlyDrafted = !!p.drafted_team_id;
          return {
            ...p,
            drafted_team_id: isCurrentlyDrafted ? null : 't1111111-1111-1111-1111-111111111111',
            drafted_team_name: isCurrentlyDrafted ? null : 'Boca Juniors FC',
          };
        }
        return p;
      })
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col p-4 md:p-8">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Navigation & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BackButton fallbackHref="/tournaments" label="Torneios" />
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                Draft Board Ativo
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-50">
              Draft dos Capitães
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Avaliações consolidadas da comunidade, arquétipos e detecção de posição real.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/tournaments/${tournamentId}/teams/t1111111-1111-1111-1111-111111111111/builder`}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] flex items-center gap-2"
            >
              <span>Abrir Squad Builder</span>
            </Link>
          </div>
        </div>

        {/* Barra de Filtros Inteligente */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome ou arquétipo (ex: Comandante, O Bruxo)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              />
            </div>

            {/* Alternador de Modo de Posição (Declarada vs Comunidade) */}
            <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
              <button
                onClick={() => setPositionFilterMode('declared')}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-all',
                  positionFilterMode === 'declared'
                    ? 'bg-zinc-800 text-zinc-100 font-bold shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                Posição Declarada
              </button>
              <button
                onClick={() => setPositionFilterMode('community')}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-all flex items-center gap-1',
                  positionFilterMode === 'community'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Posição da Comunidade</span>
              </button>
            </div>
          </div>

          {/* Filtros em linha */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-800/60">
            {/* Select Posição */}
            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs">
              <span className="text-zinc-500 font-medium">Filtrar Posição:</span>
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="bg-transparent text-zinc-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-zinc-900">Todas as Posições</option>
                {availablePositions.map((pos) => (
                  <option key={pos} value={pos} className="bg-zinc-900">
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Tier */}
            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs">
              <span className="text-zinc-500 font-medium">Tier:</span>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="bg-transparent text-zinc-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-zinc-900">Todos</option>
                <option value="S" className="bg-zinc-900">Tier S (90+)</option>
                <option value="A" className="bg-zinc-900">Tier A (80-89)</option>
                <option value="B" className="bg-zinc-900">Tier B (70-79)</option>
                <option value="C" className="bg-zinc-900">Tier C (60-69)</option>
                <option value="D" className="bg-zinc-900">Tier D (&lt;60)</option>
              </select>
            </div>

            {/* Checkbox Apenas Disponíveis */}
            <button
              onClick={() => setOnlyAvailable((prev) => !prev)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5',
                onlyAvailable
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Apenas Não-Draftados</span>
            </button>
          </div>
        </div>

        {/* Tabela do Draft */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/70 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4 cursor-pointer hover:text-zinc-200" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      <span>Jogador & Arquétipo</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Posição Declarada</th>
                  <th className="py-3.5 px-4">Posição Comunidade</th>
                  <th className="py-3.5 px-4 text-center">Tier</th>
                  <th className="py-3.5 px-4 text-center cursor-pointer hover:text-zinc-200" onClick={() => handleSort('overall')}>
                    <div className="flex items-center justify-center gap-1">
                      <span>Overall</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center cursor-pointer hover:text-zinc-200 hidden md:table-cell" onClick={() => handleSort('mechanic')}>
                    <div className="flex items-center justify-center gap-1">
                      <span>MEC</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center cursor-pointer hover:text-zinc-200 hidden md:table-cell" onClick={() => handleSort('iq')}>
                    <div className="flex items-center justify-center gap-1">
                      <span>QI</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center cursor-pointer hover:text-zinc-200 hidden md:table-cell" onClick={() => handleSort('teamplay')}>
                    <div className="flex items-center justify-center gap-1">
                      <span>TMP</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center cursor-pointer hover:text-zinc-200" onClick={() => handleSort('votes')}>
                    <div className="flex items-center justify-center gap-1">
                      <span>Votos</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right">Status / Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-sm font-medium">
                {filteredAndSorted.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-zinc-500">
                      Nenhum atleta encontrado com os filtros ativos.
                    </td>
                  </tr>
                ) : (
                  filteredAndSorted.map((player, index) => {
                    const tierInfo = TIER_MAP[player.tier];
                    const isDrafted = !!player.drafted_team_id;
                    const hasDivergence =
                      player.community_position &&
                      !player.declared_positions.includes(player.community_position);

                    return (
                      <tr
                        key={player.player_id}
                        className={cn(
                          'hover:bg-zinc-800/40 transition-colors',
                          isDrafted && 'opacity-40 bg-zinc-950/40'
                        )}
                      >
                        <td className="py-3.5 px-4 font-mono text-xs text-zinc-500">
                          {String(index + 1).padStart(2, '0')}
                        </td>

                        {/* Jogador & Arquétipo */}
                        <td className="py-3.5 px-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/players/${player.player_id}`}
                                className="font-semibold text-zinc-100 hover:text-emerald-400 hover:underline transition-colors"
                              >
                                {player.name}
                              </Link>
                              {player.is_captain && (
                                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300">
                                  <Crown className="w-2.5 h-2.5" />
                                  Capitão
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                              <Award className="w-3 h-3 text-amber-400" />
                              {player.archetype}
                            </span>
                          </div>
                        </td>

                        {/* Posições Declaradas */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
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
                        </td>

                        {/* Posição Votada pela Comunidade */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                'text-[10px] font-bold px-2 py-0.5 rounded border',
                                getPositionBadgeClass(player.community_position)
                              )}
                            >
                              {player.community_position}
                            </span>
                            <span className="text-[11px] font-mono text-zinc-400">
                              {player.community_confidence}%
                            </span>
                            {hasDivergence && (
                              <span title="Divergência: Comunidade votou posição diferente da declarada!">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Tier */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={cn(
                              'inline-block px-2.5 py-0.5 rounded-md text-xs font-black border',
                              tierInfo.badgeClass
                            )}
                          >
                            {player.tier}
                          </span>
                        </td>

                        {/* Overall */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-base font-black font-mono text-zinc-100">
                            {player.overall_score > 0 ? player.overall_score : '—'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono text-xs text-zinc-300 hidden md:table-cell">
                          {player.avg_mechanic > 0 ? player.avg_mechanic : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-xs text-zinc-300 hidden md:table-cell">
                          {player.avg_iq > 0 ? player.avg_iq : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-xs text-zinc-300 hidden md:table-cell">
                          {player.avg_teamplay > 0 ? player.avg_teamplay : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-xs text-zinc-400">
                          {player.evaluation_count}
                        </td>

                        {/* Ação / Time */}
                        <td className="py-3.5 px-4 text-right">
                          {isDrafted ? (
                            <button
                              onClick={() => handleDraftToggle(player.player_id)}
                              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-rose-500 hover:text-rose-300 transition-colors"
                            >
                              {player.drafted_team_name} (Desfazer)
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDraftToggle(player.player_id)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all"
                            >
                              Draftar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
