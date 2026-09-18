'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Tournament, 
  TournamentRules, 
  PlayerProfile, 
  TournamentParticipant, 
  ParticipantRole, 
  Match, 
  TournamentStanding,
  Team 
} from '@/types/database';
import { BackButton } from '@/components/ui/back-button';
import { 
  Shield, 
  Plus, 
  Users, 
  Trophy, 
  Crown, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Image as ImageIcon, 
  KeyRound, 
  SlidersHorizontal, 
  Save, 
  Send,
  ExternalLink
} from 'lucide-react';
import { 
  ALL_ARCHETYPES, 
  EA_FC_26_ARCHETYPES, 
  getArchetypeBadgeClass, 
  getPositionBadgeClass, 
  cn 
} from '@/lib/utils';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'matches' | 'rules' | 'captains' | 'athletes'>('matches');

  // Estados principais
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<TournamentStanding[]>([]);
  const [participants, setParticipants] = useState<(TournamentParticipant & { player_name?: string; positions?: string[] })[]>([]);
  const [allProfiles, setAllProfiles] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estados de Validador de Partidas
  const [inspectingMatch, setInspectingMatch] = useState<Match | null>(null);

  // Estados de Regras de Torneio (JSONB)
  const [currentRules, setCurrentRules] = useState<TournamentRules>({
    crossplay_gen: 'current_gen',
    min_human_players: 11,
    any_allowed: false,
    gk_required: true,
  });

  // Formulário de Criação de Torneio
  const [newTournName, setNewTournName] = useState('');
  const [newTournFormat, setNewTournFormat] = useState('11v11');

  // Formulário de Criação de Atleta
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerArchetypes, setNewPlayerArchetypes] = useState<string[]>(['Mágico']);
  const [newPlayerPositions, setNewPlayerPositions] = useState('VOL, MEI');

  // Gerenciador de Credenciais de Capitães
  const [selectedTeamForAuth, setSelectedTeamForAuth] = useState<string>('');
  const [captainEmail, setCaptainEmail] = useState('');
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');

  useEffect(() => {
    initData();
  }, []);

  useEffect(() => {
    if (selectedTournamentId) {
      loadTournamentDetails(selectedTournamentId);
    }
  }, [selectedTournamentId]);

  async function initData() {
    setLoading(true);
    try {
      const { data: tData } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });

      if (tData && tData.length > 0) {
        setTournaments(tData);
        setSelectedTournamentId(tData[0].id);
        if (tData[0].rules) {
          setCurrentRules(tData[0].rules);
        }
      }

      const { data: pData } = await supabase
        .from('player_profiles')
        .select('*')
        .order('name');
      if (pData) setAllProfiles(pData);
    } catch (e) {
      console.warn('Erro ao inicializar admin:', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadTournamentDetails(tournamentId: string) {
    try {
      // 1. Times
      const { data: teamsData } = await supabase
        .from('teams')
        .select('*')
        .eq('tournament_id', tournamentId);
      if (teamsData) setTeams(teamsData);

      // 2. Partidas
      const { data: matchesData } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name),
          away_team:teams!matches_away_team_id_fkey(id, name),
          player_stats:match_player_stats(
            *,
            player:player_profiles(name)
          )
        `)
        .eq('tournament_id', tournamentId)
        .order('created_at', { ascending: false });
      if (matchesData) setMatches(matchesData as any);

      // 3. Classificação
      const { data: standingsData } = await supabase
        .from('vw_tournament_standings')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('position', { ascending: true });
      if (standingsData) setStandings(standingsData);

      // 4. Participantes
      const { data: partsData } = await supabase
        .from('tournament_participants')
        .select('*, player_profiles(name, positions_declared, archetypes)')
        .eq('tournament_id', tournamentId);

      if (partsData) {
        const mapped = partsData.map((item: any) => ({
          ...item,
          player_name: item.player_profiles?.name || 'Desconhecido',
          positions: item.player_profiles?.positions_declared || [],
        }));
        setParticipants(mapped);
      }

      // Atualiza regras do torneio atual
      const current = tournaments.find(t => t.id === tournamentId);
      if (current?.rules) {
        setCurrentRules(current.rules);
      }
    } catch (e) {
      console.warn('Erro ao carregar detalhes do torneio:', e);
    }
  }

  // Ações de Validação de Partida
  const handleReviewMatch = async (matchId: string, status: 'approved' | 'rejected') => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('matches')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', matchId);

      if (error) throw error;

      setNotice({
        type: 'success',
        text: `Partida ${status === 'approved' ? 'aprovada com sucesso! A tabela de classificação foi atualizada.' : 'rejeitada.'}`
      });

      setInspectingMatch(null);
      loadTournamentDetails(selectedTournamentId);
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Erro ao avaliar partida.' });
    } finally {
      setSaving(false);
    }
  };

  // Salvar Regras do Torneio
  const handleSaveRules = async () => {
    if (!selectedTournamentId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ rules: currentRules })
        .eq('id', selectedTournamentId);

      if (error) throw error;

      setTournaments(prev => prev.map(t => {
        if (t.id === selectedTournamentId) {
          return { ...t, rules: currentRules };
        }
        return t;
      }));

      setNotice({ type: 'success', text: 'Regras de Pro Clubs salvas com sucesso para o torneio!' });
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Erro ao salvar regras.' });
    } finally {
      setSaving(false);
    }
  };

  // Criação de Torneio
  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTournName.trim()) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .insert({
          name: newTournName.trim(),
          format: newTournFormat,
          status: 'REGISTRATION',
          rules: currentRules,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setTournaments(prev => [data, ...prev]);
        setSelectedTournamentId(data.id);
        setNewTournName('');
        setNotice({ type: 'success', text: `Torneio "${data.name}" criado com sucesso!` });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Erro ao criar torneio.' });
    } finally {
      setSaving(false);
    }
  };

  // Gerar Convite para Capitão
  const handleGenerateCaptainInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!captainEmail) return;

    const token = Math.random().toString(36).substring(2, 12);
    const link = `${window.location.origin}/login?invite=${token}&team=${selectedTeamForAuth}&email=${encodeURIComponent(captainEmail)}`;
    setGeneratedInviteLink(link);
    setNotice({ type: 'success', text: 'Link de convite do capitão gerado com sucesso!' });
  };

  // Cadastro de Novo Atleta
  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    setSaving(true);
    try {
      const positions = newPlayerPositions
        .split(',')
        .map((p) => p.trim().toUpperCase())
        .filter(Boolean);

      const { data, error } = await supabase
        .from('player_profiles')
        .insert({
          name: newPlayerName.trim(),
          positions_declared: positions.length > 0 ? positions : ['MEI'],
          archetype: newPlayerArchetypes[0] || 'Mágico',
          archetypes: newPlayerArchetypes,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        await supabase.from('player_stats').insert({
          player_id: data.id,
          pace: 80,
          shooting: 75,
          passing: 78,
          dribbling: 82,
          defending: 65,
          physical: 74,
        });

        if (selectedTournamentId) {
          await supabase.from('tournament_participants').insert({
            tournament_id: selectedTournamentId,
            player_id: data.id,
            role: 'player',
          });
        }

        setAllProfiles(prev => [data, ...prev]);
        setNewPlayerName('');
        setNotice({ type: 'success', text: `Atleta "${data.name}" cadastrado com sucesso!` });
        loadTournamentDetails(selectedTournamentId);
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Erro ao cadastrar atleta.' });
    } finally {
      setSaving(false);
    }
  };

  const pendingMatches = matches.filter(m => m.status === 'pending');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Superior */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref="/" label="Início" />
            <div className="h-4 w-px bg-zinc-800" />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                Painel Master de Administração
              </span>
            </div>
          </div>

          {/* Seletor de Torneio Ativo */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Torneio:</span>
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-zinc-700"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.format}) - [{t.status}]
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notificações */}
        {notice && (
          <div
            className={cn(
              'p-3.5 rounded-xl text-xs flex items-center justify-between border',
              notice.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800/50 text-rose-300'
            )}
          >
            <div className="flex items-center gap-2">
              {notice.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{notice.text}</span>
            </div>
            <button onClick={() => setNotice(null)} className="text-zinc-500 hover:text-zinc-300">
              ✕
            </button>
          </div>
        )}

        {/* Abas de Navegação do Admin */}
        <div className="flex border-b border-zinc-800 gap-6 text-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab('matches')}
            className={cn(
              'pb-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap',
              activeTab === 'matches'
                ? 'text-zinc-100 border-b-2 border-emerald-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Shield className="w-4 h-4" />
            Validador de Súmulas
            {pendingMatches.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-bold">
                {pendingMatches.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={cn(
              'pb-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap',
              activeTab === 'rules'
                ? 'text-zinc-100 border-b-2 border-emerald-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Regras de Pro Clubs
          </button>

          <button
            onClick={() => setActiveTab('captains')}
            className={cn(
              'pb-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap',
              activeTab === 'captains'
                ? 'text-zinc-100 border-b-2 border-emerald-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <KeyRound className="w-4 h-4" />
            Acessos & Capitães
          </button>

          <button
            onClick={() => setActiveTab('athletes')}
            className={cn(
              'pb-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap',
              activeTab === 'athletes'
                ? 'text-zinc-100 border-b-2 border-emerald-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Users className="w-4 h-4" />
            Atletas & Arquétipos
          </button>
        </div>

        {/* ======================================================== */}
        {/* ABA 1: VALIDADOR DE PARTIDAS & CLASSIFICAÇÃO */}
        {/* ======================================================== */}
        {activeTab === 'matches' && (
          <div className="space-y-6">
            {/* Seção 1: Súmulas Pendentes com Print */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-200">
                    Súmulas Pendentes de Validação ({pendingMatches.length})
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Confira a captura de tela da EA anexada pelo capitão e valide placar e estatísticas.
                  </p>
                </div>
              </div>

              {pendingMatches.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 text-xs rounded-2xl bg-zinc-900 border border-zinc-800">
                  Nenhuma partida pendente de validação no momento.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingMatches.map(m => (
                    <div
                      key={m.id}
                      className="p-5 rounded-2xl bg-zinc-900 border border-amber-900/40 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-zinc-500">
                          Enviado em {new Date(m.created_at).toLocaleString('pt-BR')}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-800/40">
                          Pendente de Aprovação
                        </span>
                      </div>

                      {/* Placar */}
                      <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                        <span className="text-sm font-bold text-zinc-100">
                          {m.home_team?.name}
                        </span>
                        <div className="text-base font-extrabold text-amber-400 px-3 py-1 rounded bg-zinc-900 border border-zinc-800">
                          {m.home_score} x {m.away_score}
                        </div>
                        <span className="text-sm font-bold text-zinc-100">
                          {m.away_team?.name}
                        </span>
                      </div>

                      {/* Observações */}
                      {m.notes && (
                        <p className="text-xs text-zinc-400 italic bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-800/60">
                          "{m.notes}"
                        </p>
                      )}

                      {/* Prova / Print da EA */}
                      {m.proof_image_url && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-medium text-zinc-400 block">
                            Comprovante da EA (Clique para ampliar):
                          </span>
                          <div
                            onClick={() => setInspectingMatch(m)}
                            className="relative group cursor-pointer overflow-hidden rounded-xl border border-zinc-800 max-h-40 bg-zinc-950"
                          >
                            <img
                              src={m.proof_image_url}
                              alt="Comprovante da partida"
                              className="w-full h-40 object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs font-semibold text-white bg-zinc-900/90 px-3 py-1 rounded-full border border-zinc-700">
                                Inspecionar Detalhes
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Ações de Aprovação / Rejeição */}
                      <div className="flex gap-2 pt-2 border-t border-zinc-800">
                        <button
                          onClick={() => handleReviewMatch(m.id, 'approved')}
                          disabled={saving}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Aprovar Resultado
                        </button>
                        <button
                          onClick={() => handleReviewMatch(m.id, 'rejected')}
                          disabled={saving}
                          className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-rose-950/50 hover:text-rose-300 text-zinc-400 text-xs transition-colors flex items-center justify-center gap-1.5 border border-zinc-700"
                        >
                          <XCircle className="w-4 h-4" />
                          Rejeitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Seção 2: Tabela de Classificação Atualizada */}
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">
                    Tabela de Classificação Oficial (Standings)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Alimentada automaticamente após a aprovação de cada súmula pelo Administrador.
                  </p>
                </div>
                <button
                  onClick={() => loadTournamentDetails(selectedTournamentId)}
                  className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
                  title="Atualizar tabela"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {standings.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 text-xs">
                  Nenhum jogo finalizado para este torneio ainda.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[10px] text-zinc-500 uppercase bg-zinc-950/50 border-y border-zinc-800">
                      <tr>
                        <th className="py-2.5 px-3">Pos</th>
                        <th className="py-2.5 px-3">Equipe</th>
                        <th className="py-2.5 px-2 text-center">PJ</th>
                        <th className="py-2.5 px-2 text-center">V</th>
                        <th className="py-2.5 px-2 text-center">E</th>
                        <th className="py-2.5 px-2 text-center">D</th>
                        <th className="py-2.5 px-2 text-center">GP</th>
                        <th className="py-2.5 px-2 text-center">GC</th>
                        <th className="py-2.5 px-2 text-center">SG</th>
                        <th className="py-2.5 px-3 text-right font-bold text-zinc-300">PTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-mono">
                      {standings.map((s) => (
                        <tr key={s.team_id} className="hover:bg-zinc-950/30">
                          <td className="py-2.5 px-3 font-bold text-zinc-400">{s.position}º</td>
                          <td className="py-2.5 px-3 font-sans font-semibold text-zinc-200">{s.team_name}</td>
                          <td className="py-2.5 px-2 text-center text-zinc-400">{s.played}</td>
                          <td className="py-2.5 px-2 text-center text-zinc-400">{s.won}</td>
                          <td className="py-2.5 px-2 text-center text-zinc-400">{s.drawn}</td>
                          <td className="py-2.5 px-2 text-center text-zinc-400">{s.lost}</td>
                          <td className="py-2.5 px-2 text-center text-zinc-400">{s.goals_for}</td>
                          <td className="py-2.5 px-2 text-center text-zinc-400">{s.goals_against}</td>
                          <td className="py-2.5 px-2 text-center text-zinc-400">{s.goal_difference}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-400 text-sm">{s.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 2: REGRAS DE PRO CLUBS (JSONB DINÂMICO) */}
        {/* ======================================================== */}
        {activeTab === 'rules' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Configurações Dinâmicas de Pro Clubs */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">
                    Configuração de Regras do Campeonato
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Defina parâmetros técnicos exigidos pela comunidade competitiva de Pro Clubs.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Geração Crossplay */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Plataformas e Crossplay (Geração)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentRules({ ...currentRules, crossplay_gen: 'current_gen' })}
                        className={cn(
                          'p-3 rounded-xl border text-xs text-left transition-colors',
                          currentRules.crossplay_gen === 'current_gen'
                            ? 'bg-zinc-950 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                        )}
                      >
                        <span className="block font-semibold">Nova Geração</span>
                        <span className="text-[10px] text-zinc-500">PS5 / Xbox Series X|S / PC</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCurrentRules({ ...currentRules, crossplay_gen: 'old_gen' })}
                        className={cn(
                          'p-3 rounded-xl border text-xs text-left transition-colors',
                          currentRules.crossplay_gen === 'old_gen'
                            ? 'bg-zinc-950 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                        )}
                      >
                        <span className="block font-semibold">Geração Anterior</span>
                        <span className="text-[10px] text-zinc-500">PS4 / Xbox One</span>
                      </button>
                    </div>
                  </div>

                  {/* Mínimo de Humanos */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-zinc-400">
                        Mínimo de Jogadores Humanos em Campo
                      </label>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {currentRules.min_human_players} atletas
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={11}
                      value={currentRules.min_human_players}
                      onChange={(e) => setCurrentRules({ ...currentRules, min_human_players: parseInt(e.target.value) })}
                      className="w-full accent-emerald-400 bg-zinc-950 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-600 font-mono mt-1">
                      <span>2 (Minimaratona)</span>
                      <span>5 (5x5)</span>
                      <span>8 (Misto)</span>
                      <span>11 (11v11 Completo)</span>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentRules.any_allowed}
                        onChange={(e) => setCurrentRules({ ...currentRules, any_allowed: e.target.checked })}
                        className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-0"
                      />
                      <div>
                        <span className="text-xs font-semibold text-zinc-200 block">Permitir "Qualquer" (ANY)</span>
                        <span className="text-[10px] text-zinc-500">Jogador controla os bots restantes</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentRules.gk_required}
                        onChange={(e) => setCurrentRules({ ...currentRules, gk_required: e.target.checked })}
                        className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-0"
                      />
                      <div>
                        <span className="text-xs font-semibold text-zinc-200 block">Goleiro Humano Obrigatório</span>
                        <span className="text-[10px] text-zinc-500">Exige slot GK ocupado por humano</span>
                      </div>
                    </label>
                  </div>

                  <button
                    onClick={handleSaveRules}
                    disabled={saving}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? 'Gravando regras...' : 'Salvar Regras do Campeonato'}
                  </button>
                </div>
              </div>
            </div>

            {/* Criação de Novo Campeonato */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">
                    Criar Novo Campeonato (Multi-Torneio)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    SaaS agnóstico: crie ligas ou copas sem restrições de vagas.
                  </p>
                </div>

                <form onSubmit={handleCreateTournament} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Nome do Torneio</label>
                    <input
                      type="text"
                      value={newTournName}
                      onChange={(e) => setNewTournName(e.target.value)}
                      placeholder="Ex: Liga Sul-Americana FC 26"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Formato</label>
                    <select
                      value={newTournFormat}
                      onChange={(e) => setNewTournFormat(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none"
                    >
                      <option value="11v11">11v11 (Padrão Pro Clubs)</option>
                      <option value="5v5">5v5 (Campeonato Rápido)</option>
                      <option value="Copa">Copa Eliminatória</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Criar Campeonato
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 3: GESTÃO DE ACESSOS & CAPITÃES */}
        {/* ======================================================== */}
        {activeTab === 'captains' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Gerador de Convites e Links */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">
                    Gerar Acesso / Convite para Capitão
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Vincule um capitão a um dos times do torneio para liberação de acesso ao painel <code>/captain</code>.
                  </p>
                </div>

                <form onSubmit={handleGenerateCaptainInvite} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Time Representado</label>
                    <select
                      value={selectedTeamForAuth}
                      onChange={(e) => setSelectedTeamForAuth(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none"
                    >
                      <option value="">Selecione uma equipe...</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Email do Capitão</label>
                    <input
                      type="email"
                      value={captainEmail}
                      onChange={(e) => setCaptainEmail(e.target.value)}
                      placeholder="capitao@equipe.com"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    Gerar Link de Acesso / Convite
                  </button>
                </form>

                {generatedInviteLink && (
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <span className="text-[11px] font-medium text-zinc-400 block">
                      Link de Acesso Gerado (Compartilhe com o capitão):
                    </span>
                    <input
                      type="text"
                      readOnly
                      value={generatedInviteLink}
                      className="w-full px-3 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-300 select-all"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Lista de Equipes e Capitães */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Capitães Atuais do Torneio
                </h3>

                <div className="space-y-2">
                  {teams.map(t => {
                    const captainPart = participants.find(p => p.player_id === t.captain_id);
                    return (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between"
                      >
                        <div>
                          <span className="text-xs font-bold text-zinc-200 block">{t.name}</span>
                          <span className="text-[11px] text-zinc-500">
                            Capitão: {captainPart?.player_name || 'Não designado'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                          {t.active_formation}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 4: ATLETAS & ARQUÉTIPOS OFICIAIS */}
        {/* ======================================================== */}
        {activeTab === 'athletes' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Cadastro de Atleta com Múltiplos Arquétipos */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">
                    Cadastrar Atleta (EA FC 26)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Selecione arquétipos oficiais do EA FC 26 para definir os estilos do atleta.
                  </p>
                </div>

                <form onSubmit={handleCreatePlayer} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Nickname / Gamertag</label>
                    <input
                      type="text"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder="Ex: Mbappé_ProClubs"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Posições Declaradas</label>
                    <input
                      type="text"
                      value={newPlayerPositions}
                      onChange={(e) => setNewPlayerPositions(e.target.value)}
                      placeholder="Ex: ATA, PE, MEI"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      Arquétipos do EA FC 26
                    </label>
                    <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                      {ALL_ARCHETYPES.map(arch => {
                        const isSelected = newPlayerArchetypes.includes(arch);
                        return (
                          <button
                            type="button"
                            key={arch}
                            onClick={() => {
                              if (isSelected) {
                                if (newPlayerArchetypes.length > 1) {
                                  setNewPlayerArchetypes(newPlayerArchetypes.filter(a => a !== arch));
                                }
                              } else {
                                setNewPlayerArchetypes([...newPlayerArchetypes, arch]);
                              }
                            }}
                            className={cn(
                              'text-[10px] px-2 py-0.5 rounded border transition-colors',
                              isSelected
                                ? 'bg-emerald-500 text-zinc-950 font-bold border-emerald-400'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                            )}
                          >
                            {arch} {isSelected && '✓'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Cadastrar Atleta
                  </button>
                </form>
              </div>
            </div>

            {/* Listagem de Atletas com badges de Arquétipos */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Atletas Cadastrados ({allProfiles.length})
                  </h3>
                </div>

                <div className="max-h-[500px] overflow-y-auto divide-y divide-zinc-800/60">
                  {allProfiles.map((p) => {
                    const archList = p.archetypes && p.archetypes.length > 0 ? p.archetypes : [p.archetype || 'Mágico'];
                    return (
                      <div key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-200">{p.name}</span>
                            <div className="flex gap-1">
                              {p.positions_declared.map(pos => (
                                <span
                                  key={pos}
                                  className={cn('text-[9px] font-bold px-1.5 py-0.2 rounded border', getPositionBadgeClass(pos))}
                                >
                                  {pos}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {archList.map(a => (
                              <span
                                key={a}
                                className={cn('text-[9px] px-1.5 py-0.2 rounded border', getArchetypeBadgeClass(a))}
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>

                        <a
                          href={`/players/${p.id}`}
                          className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                        >
                          Ver Perfil <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Lightbox de Inspeção de Comprovante */}
        {inspectingMatch && inspectingMatch.proof_image_url && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-3xl w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-zinc-100">
                    Inspeção de Súmula Oficial EA FC 26
                  </h4>
                  <p className="text-xs text-zinc-400">
                    {inspectingMatch.home_team?.name} ({inspectingMatch.home_score}) x ({inspectingMatch.away_score}) {inspectingMatch.away_team?.name}
                  </p>
                </div>
                <button
                  onClick={() => setInspectingMatch(null)}
                  className="text-zinc-500 hover:text-zinc-200 p-1"
                >
                  ✕
                </button>
              </div>

              <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 max-h-[60vh] flex items-center justify-center">
                <img
                  src={inspectingMatch.proof_image_url}
                  alt="Comprovante de tela cheia"
                  className="max-h-[60vh] w-auto object-contain"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  onClick={() => setInspectingMatch(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-medium"
                >
                  Fechar
                </button>
                <button
                  onClick={() => handleReviewMatch(inspectingMatch.id, 'approved')}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Aprovar Súmula
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
