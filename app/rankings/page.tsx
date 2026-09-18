'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Tournament, 
  TournamentPhase, 
  TournamentStanding, 
  TopScorer, 
  TopAssist, 
  Match 
} from '@/types/database';
import { BackButton } from '@/components/ui/back-button';
import { 
  Trophy, 
  Award, 
  Flame, 
  Users, 
  Shield, 
  ArrowRight, 
  RefreshCw,
  GitFork,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RankingsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournId, setSelectedTournId] = useState<string>('11111111-1111-1111-1111-111111111111');

  const [activeTab, setActiveTab] = useState<'standings' | 'scorers' | 'assists' | 'knockout'>('standings');
  const [phases, setPhases] = useState<TournamentPhase[]>([]);
  const [standings, setStandings] = useState<TournamentStanding[]>([]);
  const [scorers, setScorers] = useState<TopScorer[]>([]);
  const [assists, setAssists] = useState<TopAssist[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournId) {
      loadTournamentData(selectedTournId);
    }
  }, [selectedTournId]);

  async function loadTournaments() {
    try {
      const { data } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false });
      if (data && data.length > 0) {
        setTournaments(data);
        setSelectedTournId(data[0].id);
      }
    } catch (e) {
      console.warn('Erro ao carregar torneios:', e);
    }
  }

  async function loadTournamentData(tournamentId: string) {
    setLoading(true);
    try {
      // 1. Fases
      const { data: phasesData } = await supabase
        .from('tournament_phases')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('order_num', { ascending: true });
      if (phasesData) setPhases(phasesData);

      // 2. Classificação Geral
      const { data: standingsData } = await supabase
        .from('vw_tournament_standings')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('position', { ascending: true });
      if (standingsData) setStandings(standingsData);

      // 3. Artilharia
      const { data: scorersData } = await supabase
        .from('vw_top_scorers')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('rank', { ascending: true });
      if (scorersData) setScorers(scorersData as any);

      // 4. Assistências
      const { data: assistsData } = await supabase
        .from('vw_top_assists')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('rank', { ascending: true });
      if (assistsData) setAssists(assistsData as any);

      // 5. Partidas
      const { data: matchesData } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name),
          away_team:teams!matches_away_team_id_fkey(id, name),
          phase:tournament_phases(name)
        `)
        .eq('tournament_id', tournamentId)
        .order('created_at', { ascending: false });
      if (matchesData) setMatches(matchesData as any);
    } catch (e) {
      console.warn('Erro ao carregar rankings:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Superior */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref="/" label="Início" />
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                E-sports Hub & Estatísticas
              </span>
            </div>
          </div>

          {/* Seletor de Torneio */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Campeonato:</span>
            <select
              value={selectedTournId}
              onChange={(e) => setSelectedTournId(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-md px-3 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.format})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Banner do Campeonato */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100">
                  {tournaments.find(t => t.id === selectedTournId)?.name || 'Torneio EA FC 26'}
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 uppercase">
                  Oficial
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Central de tabelas, fases eliminatórias estilo Copafácil, artilharia e ranking de assistências.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/tournaments/${selectedTournId}/draft`}
              className="px-3.5 py-2 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 font-medium transition-colors"
            >
              Sala de Draft →
            </Link>
          </div>
        </div>

        {/* Abas Estilo Copafácil */}
        <div className="flex border-b border-slate-800 gap-6 text-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab('standings')}
            className={cn(
              'pb-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap',
              activeTab === 'standings'
                ? 'text-slate-100 border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Trophy className="w-4 h-4 text-cyan-400" />
            Tabela de Classificação
          </button>

          <button
            onClick={() => setActiveTab('knockout')}
            className={cn(
              'pb-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap',
              activeTab === 'knockout'
                ? 'text-slate-100 border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <GitFork className="w-4 h-4 text-purple-400" />
            Fases & Chaveamento
          </button>

          <button
            onClick={() => setActiveTab('scorers')}
            className={cn(
              'pb-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap',
              activeTab === 'scorers'
                ? 'text-slate-100 border-b-2 border-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            Artilharia ({scorers.length})
          </button>

          <button
            onClick={() => setActiveTab('assists')}
            className={cn(
              'pb-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap',
              activeTab === 'assists'
                ? 'text-slate-100 border-b-2 border-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Award className="w-4 h-4 text-emerald-400" />
            Assistências ({assists.length})
          </button>
        </div>

        {/* ======================================================== */}
        {/* ABA 1: TABELA DE CLASSIFICAÇÃO */}
        {/* ======================================================== */}
        {activeTab === 'standings' && (
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">
                  Fase de Grupos / Pontos Corridos
                </h3>
                <p className="text-xs text-slate-500">
                  Critérios: Pontos (PTS) &gt; Saldo de Gols (SG) &gt; Gols Pró (GP) &gt; Vitórias (V)
                </p>
              </div>
              <button
                onClick={() => loadTournamentData(selectedTournId)}
                className="p-1.5 rounded-md bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-500 text-xs">Carregando classificação...</div>
            ) : standings.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">Nenhum resultado homologado ainda.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] text-slate-500 uppercase bg-slate-950/60 border-y border-slate-800">
                    <tr>
                      <th className="py-3 px-3">Pos</th>
                      <th className="py-3 px-3">Equipe</th>
                      <th className="py-3 px-2 text-center">PJ</th>
                      <th className="py-3 px-2 text-center">V</th>
                      <th className="py-3 px-2 text-center">E</th>
                      <th className="py-3 px-2 text-center">D</th>
                      <th className="py-3 px-2 text-center">GP</th>
                      <th className="py-3 px-2 text-center">GC</th>
                      <th className="py-3 px-2 text-center">SG</th>
                      <th className="py-3 px-3 text-right font-bold text-slate-300">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {standings.map((s) => (
                      <tr key={s.team_id} className="hover:bg-slate-950/30">
                        <td className="py-3 px-3 font-bold text-slate-400">{s.position}º</td>
                        <td className="py-3 px-3 font-sans font-semibold text-slate-200">{s.team_name}</td>
                        <td className="py-3 px-2 text-center text-slate-400">{s.played}</td>
                        <td className="py-3 px-2 text-center text-slate-400">{s.won}</td>
                        <td className="py-3 px-2 text-center text-slate-400">{s.drawn}</td>
                        <td className="py-3 px-2 text-center text-slate-400">{s.lost}</td>
                        <td className="py-3 px-2 text-center text-slate-400">{s.goals_for}</td>
                        <td className="py-3 px-2 text-center text-slate-400">{s.goals_against}</td>
                        <td className="py-3 px-2 text-center text-slate-400">{s.goal_difference}</td>
                        <td className="py-3 px-3 text-right font-bold text-cyan-400 text-sm">{s.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 2: FASES & MATA-MATA (COPAFÁCIL BRACKET) */}
        {/* ======================================================== */}
        {activeTab === 'knockout' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {phases.map((ph) => {
                const phaseMatches = matches.filter(m => m.phase_id === ph.id);
                return (
                  <div key={ph.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        {ph.name}
                      </h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                        {ph.phase_type === 'groups' ? 'Grupos' : 'Mata-Mata'}
                      </span>
                    </div>

                    {phaseMatches.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-4 text-center">
                        Nenhum confronto agendado.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {phaseMatches.map((m) => (
                          <div key={m.id} className="p-2.5 rounded-md bg-slate-950 border border-slate-800 text-xs">
                            <div className="flex items-center justify-between font-semibold">
                              <span className="text-slate-300">{m.home_team?.name}</span>
                              <span className="text-cyan-400 font-bold px-2 py-0.5 rounded bg-slate-900">
                                {m.home_score} x {m.away_score}
                              </span>
                              <span className="text-slate-300">{m.away_team?.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 3: ARTILHARIA */}
        {/* ======================================================== */}
        {activeTab === 'scorers' && (
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                Artilharia Oficial da Competição
              </h3>
              <p className="text-xs text-slate-500">
                Gols computados a partir de súmulas oficiais aprovadas pela administração.
              </p>
            </div>

            {scorers.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">Nenhum gol registrado ainda.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] text-slate-500 uppercase bg-slate-950/60 border-y border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Atleta</th>
                      <th className="py-2.5 px-3">Equipe</th>
                      <th className="py-2.5 px-2 text-center">Partidas</th>
                      <th className="py-2.5 px-2 text-center">Média/Jogo</th>
                      <th className="py-2.5 px-3 text-right font-bold text-amber-400">Gols</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {scorers.map((sc) => (
                      <tr key={sc.player_id} className="hover:bg-slate-950/30">
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{sc.rank}º</td>
                        <td className="py-2.5 px-3 font-bold text-slate-200">
                          <Link href={`/players/${sc.player_id}`} className="hover:underline">
                            {sc.player_name}
                          </Link>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{sc.team_name}</td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-400">{sc.matches_played}</td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-400">{sc.goals_per_match}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400 text-sm">
                          {sc.goals_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 4: LÍDERES DE ASSISTÊNCIA */}
        {/* ======================================================== */}
        {activeTab === 'assists' && (
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                Líderes de Assistência (Garçons da Competição)
              </h3>
              <p className="text-xs text-slate-500">
                Passes para gol computados oficialmente nas partidas validadas.
              </p>
            </div>

            {assists.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">Nenhuma assistência registrada ainda.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] text-slate-500 uppercase bg-slate-950/60 border-y border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Atleta</th>
                      <th className="py-2.5 px-3">Equipe</th>
                      <th className="py-2.5 px-2 text-center">Partidas</th>
                      <th className="py-2.5 px-3 text-right font-bold text-emerald-400">Assistências</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {assists.map((asst) => (
                      <tr key={asst.player_id} className="hover:bg-slate-950/30">
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">{asst.rank}º</td>
                        <td className="py-2.5 px-3 font-bold text-slate-200">
                          <Link href={`/players/${asst.player_id}`} className="hover:underline">
                            {asst.player_name}
                          </Link>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{asst.team_name}</td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-400">{asst.matches_played}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 text-sm">
                          {asst.assists_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
