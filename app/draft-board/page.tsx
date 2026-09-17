'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { PlayerStats, Tier } from '@/types/database';
import { TIER_MAP, getPositionBadgeClass, cn } from '@/lib/utils';
import { 
  Search, 
  Filter, 
  Crown, 
  TrendingUp, 
  Users, 
  Star, 
  SlidersHorizontal, 
  ShieldCheck, 
  ArrowUpDown,
  Flame,
  Cpu,
  UserCheck
} from 'lucide-react';

const FALLBACK_STATS: PlayerStats[] = [
  {
    player_id: '1',
    name: 'Jefhe',
    positions: ['PE', 'ME', 'ATA', 'MEI', 'VOL'],
    is_captain: false,
    evaluation_count: 5,
    avg_mechanic: 91.2,
    avg_iq: 92.5,
    avg_teamplay: 90.8,
    overall_score: 91.5,
    tier: 'S',
  },
  {
    player_id: '2',
    name: 'buzz',
    positions: ['ATA', 'PE'],
    is_captain: true,
    evaluation_count: 4,
    avg_mechanic: 94.0,
    avg_iq: 92.0,
    avg_teamplay: 88.5,
    overall_score: 91.5,
    tier: 'S',
  },
  {
    player_id: '3',
    name: 'Morges',
    positions: ['ATA', 'PE', 'PD', 'MEI', 'ME', 'MD'],
    is_captain: false,
    evaluation_count: 3,
    avg_mechanic: 90.0,
    avg_iq: 89.0,
    avg_teamplay: 91.0,
    overall_score: 90.0,
    tier: 'S',
  },
  {
    player_id: '4',
    name: 'J4PA',
    positions: ['MEI'],
    is_captain: false,
    evaluation_count: 4,
    avg_mechanic: 89.0,
    avg_iq: 90.5,
    avg_teamplay: 88.0,
    overall_score: 89.2,
    tier: 'A',
  },
  {
    player_id: '5',
    name: 'Ribeiro',
    positions: ['ZAG', 'VOL', 'MC'],
    is_captain: false,
    evaluation_count: 4,
    avg_mechanic: 88.0,
    avg_iq: 91.0,
    avg_teamplay: 87.0,
    overall_score: 88.7,
    tier: 'A',
  },
  {
    player_id: '6',
    name: 'Deivy',
    positions: ['MEI', 'VOL'],
    is_captain: true,
    evaluation_count: 3,
    avg_mechanic: 85.0,
    avg_iq: 87.0,
    avg_teamplay: 88.0,
    overall_score: 86.7,
    tier: 'A',
  },
  {
    player_id: '7',
    name: 'JV',
    positions: ['ATA'],
    is_captain: false,
    evaluation_count: 6,
    avg_mechanic: 82.5,
    avg_iq: 84.0,
    avg_teamplay: 83.5,
    overall_score: 83.3,
    tier: 'A',
  },
  {
    player_id: '8',
    name: 'julião',
    positions: ['VOL', 'MEI'],
    is_captain: false,
    evaluation_count: 3,
    avg_mechanic: 78.0,
    avg_iq: 75.0,
    avg_teamplay: 79.0,
    overall_score: 77.3,
    tier: 'B',
  },
  {
    player_id: '9',
    name: 'Marcão',
    positions: ['VOL'],
    is_captain: false,
    evaluation_count: 2,
    avg_mechanic: 72.0,
    avg_iq: 70.0,
    avg_teamplay: 68.0,
    overall_score: 70.0,
    tier: 'B',
  },
  {
    player_id: '10',
    name: 'Careca',
    positions: ['MC'],
    is_captain: false,
    evaluation_count: 2,
    avg_mechanic: 65.0,
    avg_iq: 60.0,
    avg_teamplay: 62.0,
    overall_score: 62.3,
    tier: 'C',
  },
  {
    player_id: '11',
    name: 'gustavin171',
    positions: ['CA', 'ALA'],
    is_captain: false,
    evaluation_count: 0,
    avg_mechanic: 0,
    avg_iq: 0,
    avg_teamplay: 0,
    overall_score: 0,
    tier: 'UNRATED',
  },
  {
    player_id: '12',
    name: 'Andrei',
    positions: ['ZAG', 'VOL'],
    is_captain: true,
    evaluation_count: 0,
    avg_mechanic: 0,
    avg_iq: 0,
    avg_teamplay: 0,
    overall_score: 0,
    tier: 'UNRATED',
  },
];

type SortField = 'overall' | 'mechanic' | 'iq' | 'teamplay' | 'votes' | 'name';
type SortDirection = 'asc' | 'desc';

export default function DraftBoardPage() {
  const [stats, setStats] = useState<PlayerStats[]>(FALLBACK_STATS);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [onlyCaptains, setOnlyCaptains] = useState<boolean>(false);
  const [sortField, setSortField] = useState<SortField>('overall');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [draftedIds, setDraftedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data, error } = await supabase
          .from('vw_player_stats')
          .select('*');

        if (!error && data && data.length > 0) {
          setStats(data as PlayerStats[]);
        }
      } catch (err) {
        console.warn('Conexão remota não disponível, utilizando mock consolidado.', err);
      }
    }
    fetchStats();
  }, []);

  // Coleta todas as posições únicas para preencher o filtro
  const availablePositions = useMemo(() => {
    const posSet = new Set<string>();
    stats.forEach((p) => p.positions.forEach((pos) => posSet.add(pos.trim().toUpperCase())));
    return Array.from(posSet).sort();
  }, [stats]);

  // Alternar status de draftado localmente para o capitão
  const toggleDrafted = (id: string) => {
    setDraftedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filtragem e Ordenação
  const filteredAndSorted = useMemo(() => {
    return stats
      .filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPosition =
          selectedPosition === 'ALL' ||
          p.positions.some((pos) => pos.trim().toUpperCase() === selectedPosition);
        const matchesTier = selectedTier === 'ALL' || p.tier === selectedTier;
        const matchesCaptain = !onlyCaptains || p.is_captain;
        return matchesSearch && matchesPosition && matchesTier && matchesCaptain;
      })
      .sort((a, b) => {
        let valA: any;
        let valB: any;

        switch (sortField) {
          case 'name':
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
            break;
          case 'mechanic':
            valA = a.avg_mechanic;
            valB = b.avg_mechanic;
            break;
          case 'iq':
            valA = a.avg_iq;
            valB = b.avg_iq;
            break;
          case 'teamplay':
            valA = a.avg_teamplay;
            valB = b.avg_teamplay;
            break;
          case 'votes':
            valA = a.evaluation_count;
            valB = b.evaluation_count;
            break;
          case 'overall':
          default:
            valA = a.overall_score;
            valB = b.overall_score;
            break;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [stats, searchTerm, selectedPosition, selectedTier, onlyCaptains, sortField, sortDirection]);

  // Métricas agregadas para o topo do Board
  const metrics = useMemo(() => {
    const total = stats.length;
    const evaluated = stats.filter((p) => p.evaluation_count > 0).length;
    const captainsCount = stats.filter((p) => p.is_captain).length;
    const evaluatedList = stats.filter((p) => p.overall_score > 0);
    const avgLeague =
      evaluatedList.length > 0
        ? Math.round(
            (evaluatedList.reduce((acc, p) => acc + p.overall_score, 0) / evaluatedList.length) * 10
          ) / 10
        : 0;

    return { total, evaluated, captainsCount, avgLeague };
  }, [stats]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col p-4 md:p-8">
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-900/60 via-zinc-950 to-zinc-950 pointer-events-none -z-10" />

      {/* Header do Board */}
      <header className="max-w-7xl mx-auto w-full mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wider uppercase">
                Área Restrita dos Capitães
              </span>
              <span className="text-zinc-500 text-xs">• 8 Times • 40 Vagas</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-50 mt-1 flex items-center gap-2">
              Draft Board <span className="text-emerald-400 font-mono text-xl md:text-2xl font-normal">/ Liga Argentina</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/evaluate"
              className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-semibold tracking-wide uppercase transition-colors"
            >
              Ir para Avaliações
            </a>
          </div>
        </div>

        {/* KPIs Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold uppercase">
              <span>Total Jogadores</span>
              <Users className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="text-2xl font-black font-mono text-zinc-100 mt-2">
              {metrics.total}
            </div>
          </div>

          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold uppercase">
              <span>Avaliados</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-2">
              {metrics.evaluated} <span className="text-xs text-zinc-500 font-sans font-normal">/ {metrics.total}</span>
            </div>
          </div>

          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold uppercase">
              <span>Média da Liga</span>
              <TrendingUp className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black font-mono text-sky-400 mt-2">
              {metrics.avgLeague} <span className="text-xs text-zinc-500 font-sans font-normal">OVR</span>
            </div>
          </div>

          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold uppercase">
              <span>Capitães</span>
              <Crown className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black font-mono text-amber-400 mt-2">
              {metrics.captainsCount}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full space-y-6">
        {/* Barra de Filtros e Busca */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar atleta por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
          </div>

          {/* Filtros em Linha */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Posição */}
            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs">
              <span className="text-zinc-500 font-medium">Posição:</span>
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="bg-transparent text-zinc-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-zinc-900">Todas</option>
                {availablePositions.map((pos) => (
                  <option key={pos} value={pos} className="bg-zinc-900">
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            {/* Tier */}
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
                <option value="UNRATED" className="bg-zinc-900">Sem Avaliação</option>
              </select>
            </div>

            {/* Toggle Apenas Capitães */}
            <button
              onClick={() => setOnlyCaptains((prev) => !prev)}
              className={cn(
                'px-3 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5',
                onlyCaptains
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              )}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Capitães</span>
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
                  <th 
                    className="py-3.5 px-4 cursor-pointer hover:text-zinc-200"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Jogador</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Posições</th>
                  <th className="py-3.5 px-4 text-center">Tier</th>
                  <th 
                    className="py-3.5 px-4 text-center cursor-pointer hover:text-zinc-200"
                    onClick={() => handleSort('overall')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Overall</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="py-3.5 px-4 text-center cursor-pointer hover:text-zinc-200 hidden md:table-cell"
                    onClick={() => handleSort('mechanic')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Mecânica</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="py-3.5 px-4 text-center cursor-pointer hover:text-zinc-200 hidden md:table-cell"
                    onClick={() => handleSort('iq')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>QI Tático</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="py-3.5 px-4 text-center cursor-pointer hover:text-zinc-200 hidden md:table-cell"
                    onClick={() => handleSort('teamplay')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Teamplay</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="py-3.5 px-4 text-center cursor-pointer hover:text-zinc-200"
                    onClick={() => handleSort('votes')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Votos</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-sm font-medium">
                {filteredAndSorted.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-zinc-500">
                      Nenhum atleta encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredAndSorted.map((player, index) => {
                    const tierInfo = TIER_MAP[player.tier];
                    const isDrafted = draftedIds.has(player.player_id);

                    return (
                      <tr
                        key={player.player_id}
                        className={cn(
                          'hover:bg-zinc-800/40 transition-colors',
                          isDrafted && 'opacity-40 bg-zinc-950/40 line-through-name'
                        )}
                      >
                        {/* Rank Index */}
                        <td className="py-3.5 px-4 font-mono text-xs text-zinc-500">
                          {String(index + 1).padStart(2, '0')}
                        </td>

                        {/* Nome & Tag de Capitão */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className={cn('font-semibold text-zinc-100', isDrafted && 'text-zinc-400')}>
                              {player.name}
                            </span>
                            {player.is_captain && (
                              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300">
                                <Crown className="w-2.5 h-2.5" />
                                Capitão
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Posições */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {player.positions.map((pos) => (
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

                        {/* Tier Badge */}
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

                        {/* Overall Score */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-base font-black font-mono text-zinc-100">
                            {player.overall_score > 0 ? player.overall_score : '—'}
                          </span>
                        </td>

                        {/* Mecânica */}
                        <td className="py-3.5 px-4 text-center font-mono text-xs text-zinc-300 hidden md:table-cell">
                          {player.avg_mechanic > 0 ? player.avg_mechanic : '—'}
                        </td>

                        {/* QI */}
                        <td className="py-3.5 px-4 text-center font-mono text-xs text-zinc-300 hidden md:table-cell">
                          {player.avg_iq > 0 ? player.avg_iq : '—'}
                        </td>

                        {/* Teamplay */}
                        <td className="py-3.5 px-4 text-center font-mono text-xs text-zinc-300 hidden md:table-cell">
                          {player.avg_teamplay > 0 ? player.avg_teamplay : '—'}
                        </td>

                        {/* Quantidade de avaliações */}
                        <td className="py-3.5 px-4 text-center font-mono text-xs text-zinc-400">
                          {player.evaluation_count}
                        </td>

                        {/* Draft Status Action */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => toggleDrafted(player.player_id)}
                            className={cn(
                              'text-xs font-bold px-3 py-1.5 rounded-lg border transition-all',
                              isDrafted
                                ? 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            )}
                          >
                            {isDrafted ? 'Draftado' : 'Escolher'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
