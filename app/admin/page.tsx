'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Tournament, 
  TournamentRules, 
  PlayerProfile, 
  TournamentParticipant, 
  Match, 
  TournamentStanding,
  TournamentPhase,
  Team 
} from '@/types/database';
import { BackButton } from '@/components/ui/back-button';
import { 
  Shield, 
  Plus, 
  Users, 
  Trophy, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  KeyRound, 
  SlidersHorizontal, 
  Save, 
  GitFork,
  ExternalLink,
  Copy
} from 'lucide-react';
import { 
  ALL_ARCHETYPES, 
  getArchetypeBadgeClass, 
  getPositionBadgeClass, 
  cn 
} from '@/lib/utils';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'matches' | 'phases' | 'rules' | 'captains' | 'athletes'>('matches');

  // Estados principais
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [phases, setPhases] = useState<TournamentPhase[]>([]);
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

  // Formulário de Criação de Fase (Copafácil)
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseType, setNewPhaseType] = useState<'groups' | 'knockout'>('knockout');

  // Formulário de Criação de Atleta
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerArchetypes, setNewPlayerArchetypes] = useState<string[]>(['Mágico']);
  const [newPlayerPositions, setNewPlayerPositions] = useState('VOL, MEI');

  // Gerenciador de Credenciais de Capitães
  const [selectedTeamForAuth, setSelectedTeamForAuth] = useState<string>('');
  const [captainEmail, setCaptainEmail] = useState('');
  const [captainPassword, setCaptainPassword] = useState('');
  const [generatedCredentialMsg, setGeneratedCredentialMsg] = useState<{ email: string; pass: string; team: string } | null>(null);

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
      if (teamsData) {
        setTeams(teamsData);
        if (!selectedTeamForAuth && teamsData.length > 0) {
          setSelectedTeamForAuth(teamsData[0].id);
        }
      }

      // 2. Fases
      const { data: phasesData } = await supabase
        .from('tournament_phases')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('order_num', { ascending: true });
      if (phasesData) setPhases(phasesData);

      // 3. Partidas
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

      // 4. Classificação
      const { data: standingsData } = await supabase
        .from('vw_tournament_standings')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('position', { ascending: true });
      if (standingsData) setStandings(standingsData);

      // 5. Participantes
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
        text: `Partida ${status === 'approved' ? 'aprovada! Classificação e artilharia foram atualizadas.' : 'rejeitada.'}`
      });

      setInspectingMatch(null);
      loadTournamentDetails(selectedTournamentId);
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Erro ao avaliar partida.' });
    } finally {
      setSaving(false);
    }
  };

  // Salvar Nova Fase (Copafácil)
  const handleCreatePhase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhaseName.trim()) return;

    setSaving(true);
    try {
      const orderNum = phases.length + 1;
      const { data, error } = await supabase
        .from('tournament_phases')
        .insert({
          tournament_id: selectedTournamentId,
          name: newPhaseName.trim(),
          phase_type: newPhaseType,
          order_num: orderNum,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setPhases([...phases, data]);
        setNewPhaseName('');
        setNotice({ type: 'success', text: `Fase "${data.name}" criada com sucesso!` });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Erro ao criar fase.' });
    } finally {
      setSaving(false);
    }
  };

  // Gerar Credenciais de Capitão
  const handleGenerateCaptainCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captainEmail || !selectedTeamForAuth) {
      setNotice({ type: 'error', text: 'Selecione a equipe e insira o e-mail do capitão.' });
      return;
    }

    setSaving(true);
    try {
      const targetTeam = teams.find(t => t.id === selectedTeamForAuth);
      const generatedPass = captainPassword.trim() || `Cap@${Math.random().toString(36).substring(2, 8)}!`;

      // Registrar usuário no Supabase Auth ou simular credenciais oficiais
      const { error: authErr } = await supabase.auth.signUp({
        email: captainEmail.trim(),
        password: generatedPass,
        options: {
          data: {
            name: `Capitão - ${targetTeam?.name || 'Clube'}`,
            role: 'captain',
            team_id: selectedTeamForAuth,
          },
        },
      });

      if (authErr && !authErr.message.includes('already registered')) {
        console.warn('Nota auth signup:', authErr.message);
      }

      setGeneratedCredentialMsg({
        email: captainEmail.trim(),
        pass: generatedPass,
        team: targetTeam?.name || 'Clube',
      });

      setNotice({
        type: 'success',
        text: `Credenciais geradas para o Capitão do ${targetTeam?.name}!`,
      });
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Erro ao gerar credenciais.' });
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

      setNotice({ type: 'success', text: 'Regras salvas com sucesso!' });
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
        setNotice({ type: 'success', text: `Campeonato "${data.name}" criado!` });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Erro ao criar torneio.' });
    } finally {
      setSaving(false);
    }
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
        setNotice({ type: 'success', text: `Atleta "${data.name}" cadastrado!` });
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Superior */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref="/" label="Início" />
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Painel Master Admin
              </span>
            </div>
          </div>

          {/* Seletor de Torneio */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Campeonato:</span>
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
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

        {/* Notificações */}
        {notice && (
          <div
            className={cn(
              'p-3.5 rounded-md text-xs flex items-center justify-between border',
              notice.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800/50 text-rose-300'
            )}
          >
            <div className="flex items-center gap-2">
              {notice.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{notice.text}</span>
            </div>
            <button onClick={() => setNotice(null)} className="text-slate-500 hover:text-slate-300">
              ✕
            </button>
          </div>
        )}

        {/* Abas de Navegação */}
        <div className="flex border-b border-slate-800 gap-6 text-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab('matches')}
            className={cn(
              'pb-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap',
              activeTab === 'matches'
                ? 'text-slate-100 border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Shield className="w-4 h-4 text-cyan-400" />
            Validador de Súmulas
            {pendingMatches.length > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[10px] font-bold">
                {pendingMatches.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('phases')}
            className={cn(
              'pb-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap',
              activeTab === 'phases'
                ? 'text-slate-100 border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <GitFork className="w-4 h-4 text-purple-400" />
            Fases & Chaveamento
          </button>

          <button
            onClick={() => setActiveTab('captains')}
            className={cn(
              'pb-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap',
              activeTab === 'captains'
                ? 'text-slate-100 border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            Acessos & Capitães
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={cn(
              'pb-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap',
              activeTab === 'rules'
                ? 'text-slate-100 border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            Regras de Pro Clubs
          </button>

          <button
            onClick={() => setActiveTab('athletes')}
            className={cn(
              'pb-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap',
              activeTab === 'athletes'
                ? 'text-slate-100 border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Users className="w-4 h-4 text-slate-400" />
            Atletas & Arquétipos
          </button>
        </div>

        {/* ======================================================== */}
        {/* ABA 1: VALIDADOR DE SÚMULAS */}
        {/* ======================================================== */}
        {activeTab === 'matches' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-200">
                    Súmulas Enviadas pelos Capitães ({pendingMatches.length} pendentes)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Inspecione os prints enviados da tela final da partida do EA FC 26 e aprove ou rejeite.
                  </p>
                </div>
              </div>

              {pendingMatches.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs rounded-xl bg-slate-900 border border-slate-800">
                  Nenhuma partida pendente de validação.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingMatches.map(m => (
                    <div
                      key={m.id}
                      className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">
                          {new Date(m.created_at).toLocaleString('pt-BR')}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
                          Pendente de Validação
                        </span>
                      </div>

                      {/* Placar */}
                      <div className="p-3.5 rounded-md bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-100">
                          {m.home_team?.name}
                        </span>
                        <div className="text-base font-extrabold text-amber-400 px-3 py-1 rounded bg-slate-900 border border-slate-800">
                          {m.home_score} x {m.away_score}
                        </div>
                        <span className="text-sm font-bold text-slate-100">
                          {m.away_team?.name}
                        </span>
                      </div>

                      {/* Comprovante */}
                      {m.proof_image_url && (
                        <div
                          onClick={() => setInspectingMatch(m)}
                          className="relative cursor-pointer overflow-hidden rounded-md border border-slate-800 h-36 bg-slate-950 group"
                        >
                          <img
                            src={m.proof_image_url}
                            alt="Comprovante"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs font-semibold text-white bg-slate-900 px-3 py-1 rounded-md border border-slate-700">
                              Ampliar Comprovante
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Ações */}
                      <div className="flex gap-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => handleReviewMatch(m.id, 'approved')}
                          disabled={saving}
                          className="flex-1 py-2 px-3 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Aprovar Resultado
                        </button>
                        <button
                          onClick={() => handleReviewMatch(m.id, 'rejected')}
                          disabled={saving}
                          className="py-2 px-3 rounded-md bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
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

            {/* Tabela de Classificação Atualizada */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Classificação Oficial Consolidada
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] text-slate-500 uppercase bg-slate-950/60 border-y border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Pos</th>
                      <th className="py-2.5 px-3">Equipe</th>
                      <th className="py-2.5 px-2 text-center">PJ</th>
                      <th className="py-2.5 px-2 text-center">V</th>
                      <th className="py-2.5 px-2 text-center">E</th>
                      <th className="py-2.5 px-2 text-center">D</th>
                      <th className="py-2.5 px-2 text-center">SG</th>
                      <th className="py-2.5 px-3 text-right font-bold text-cyan-400">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {standings.map((s) => (
                      <tr key={s.team_id} className="hover:bg-slate-950/30">
                        <td className="py-2 px-3 text-slate-400">{s.position}º</td>
                        <td className="py-2 px-3 font-sans font-semibold text-slate-200">{s.team_name}</td>
                        <td className="py-2 px-2 text-center text-slate-400">{s.played}</td>
                        <td className="py-2 px-2 text-center text-slate-400">{s.won}</td>
                        <td className="py-2 px-2 text-center text-slate-400">{s.drawn}</td>
                        <td className="py-2 px-2 text-center text-slate-400">{s.lost}</td>
                        <td className="py-2 px-2 text-center text-slate-400">{s.goal_difference}</td>
                        <td className="py-2 px-3 text-right font-bold text-cyan-400">{s.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 2: FASES DO CAMPEONATO (ESTILO COPAFÁCIL) */}
        {/* ======================================================== */}
        {activeTab === 'phases' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    Criar Nova Fase (Copafácil)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Defina fases de grupos, oitavas, quartas, semifinais ou final.
                  </p>
                </div>

                <form onSubmit={handleCreatePhase} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Nome da Fase</label>
                    <input
                      type="text"
                      required
                      value={newPhaseName}
                      onChange={(e) => setNewPhaseName(e.target.value)}
                      placeholder="Ex: Quartas de Final"
                      className="w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Tipo de Fase</label>
                    <select
                      value={newPhaseType}
                      onChange={(e) => setNewPhaseType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="groups">Fase de Grupos (Pontos Corridos)</option>
                      <option value="knockout">Mata-Mata (Eliminatória Simples)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-2.5 px-4 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Fase ao Campeonato
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Fases Configuradas ({phases.length})
              </h3>

              <div className="space-y-2">
                {phases.map((ph, idx) => (
                  <div
                    key={ph.id}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-xs font-mono text-cyan-400">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">{ph.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {ph.phase_type === 'groups' ? 'Pontos Corridos' : 'Eliminatória Mata-Mata'}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-950 text-emerald-400 border border-slate-800">
                      {ph.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 3: GESTÃO DE ACESSOS E CAPITÃES */}
        {/* ======================================================== */}
        {activeTab === 'captains' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 space-y-4">
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    Gerar Credenciais Oficiais de Capitão
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cadastre o login e a senha do capitão vinculado diretamente ao clube para acesso a <code>/captain</code>.
                  </p>
                </div>

                <form onSubmit={handleGenerateCaptainCredentials} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Clube Representado</label>
                    <select
                      value={selectedTeamForAuth}
                      onChange={(e) => setSelectedTeamForAuth(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none"
                    >
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">E-mail de Login do Capitão</label>
                    <input
                      type="email"
                      required
                      value={captainEmail}
                      onChange={(e) => setCaptainEmail(e.target.value)}
                      placeholder="capitao@clube.com"
                      className="w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Senha de Acesso (Deixe em branco para auto-gerar)
                    </label>
                    <input
                      type="text"
                      value={captainPassword}
                      onChange={(e) => setCaptainPassword(e.target.value)}
                      placeholder="Senha provisória..."
                      className="w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-2.5 px-4 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    Gerar Acesso do Capitão
                  </button>
                </form>

                {generatedCredentialMsg && (
                  <div className="p-4 rounded-md bg-slate-950 border border-amber-800/50 space-y-2">
                    <span className="text-xs font-bold text-amber-400 block">
                      Credenciais Prontas para Envio:
                    </span>
                    <div className="text-xs font-mono text-slate-300 space-y-1">
                      <p><strong>Clube:</strong> {generatedCredentialMsg.team}</p>
                      <p><strong>E-mail:</strong> {generatedCredentialMsg.email}</p>
                      <p><strong>Senha:</strong> {generatedCredentialMsg.pass}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-6 space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Clubes e Capitanias no Torneio
              </h3>
              <div className="space-y-2">
                {teams.map(t => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">{t.name}</span>
                      <span className="text-[11px] text-slate-500">
                        Esquema Tático Ativo: {t.active_formation}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                      Capitão Vinculado
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 4: REGRAS DO PRO CLUBS */}
        {/* ======================================================== */}
        {activeTab === 'rules' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    Regras Competitivas do Torneio
                  </h3>
                  <p className="text-xs text-slate-500">
                    Parâmetros oficiais aplicados no campeonato.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Geração de Crossplay</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentRules({ ...currentRules, crossplay_gen: 'current_gen' })}
                        className={cn(
                          'p-3 rounded-md border text-xs text-left transition-colors',
                          currentRules.crossplay_gen === 'current_gen'
                            ? 'bg-slate-950 border-cyan-500 text-cyan-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        )}
                      >
                        Nova Geração (PS5 / Xbox Series / PC)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentRules({ ...currentRules, crossplay_gen: 'old_gen' })}
                        className={cn(
                          'p-3 rounded-md border text-xs text-left transition-colors',
                          currentRules.crossplay_gen === 'old_gen'
                            ? 'bg-slate-950 border-cyan-500 text-cyan-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        )}
                      >
                        Geração Anterior (PS4 / Xbox One)
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-400">Mínimo de Jogadores Humanos</label>
                      <span className="text-xs font-mono font-bold text-cyan-400">{currentRules.min_human_players}</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={11}
                      value={currentRules.min_human_players}
                      onChange={(e) => setCurrentRules({ ...currentRules, min_human_players: parseInt(e.target.value) })}
                      className="w-full accent-cyan-400 bg-slate-950 rounded-md"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                    <label className="flex items-center gap-3 p-3 rounded-md bg-slate-950 border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentRules.any_allowed}
                        onChange={(e) => setCurrentRules({ ...currentRules, any_allowed: e.target.checked })}
                        className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                      />
                      <span className="text-xs font-semibold text-slate-200">Permitir ANY</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-md bg-slate-950 border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentRules.gk_required}
                        onChange={(e) => setCurrentRules({ ...currentRules, gk_required: e.target.checked })}
                        className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                      />
                      <span className="text-xs font-semibold text-slate-200">Goleiro Obrigatório</span>
                    </label>
                  </div>

                  <button
                    onClick={handleSaveRules}
                    disabled={saving}
                    className="w-full py-2.5 px-4 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Salvar Regras
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <h3 className="text-sm font-semibold text-slate-200">Criar Novo Torneio</h3>
                <form onSubmit={handleCreateTournament} className="space-y-3">
                  <input
                    type="text"
                    required
                    value={newTournName}
                    onChange={(e) => setNewTournName(e.target.value)}
                    placeholder="Nome da Liga ou Copa..."
                    className="w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                  <select
                    value={newTournFormat}
                    onChange={(e) => setNewTournFormat(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="11v11">11v11 (Padrão)</option>
                    <option value="5v5">5v5 (Rápido)</option>
                    <option value="Copa">Copa Mata-Mata</option>
                  </select>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-2 px-3 rounded-md bg-slate-100 hover:bg-white text-slate-950 font-bold text-xs transition-colors"
                  >
                    + Criar Torneio
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 5: ATLETAS & ARQUÉTIPOS OFICIAIS */}
        {/* ======================================================== */}
        {activeTab === 'athletes' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-slate-200">Cadastrar Atleta (Master)</h3>
                <form onSubmit={handleCreatePlayer} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Gamertag EA</label>
                    <input
                      type="text"
                      required
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder="Ex: Neymar_ProClubs"
                      className="w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Posições</label>
                    <input
                      type="text"
                      value={newPlayerPositions}
                      onChange={(e) => setNewPlayerPositions(e.target.value)}
                      placeholder="Ex: ATA, PE, MEI"
                      className="w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Arquétipos do EA FC 26 (14 Oficiais)
                    </label>
                    <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto p-2 rounded-md bg-slate-950 border border-slate-800">
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
                                ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                                : 'bg-slate-900 text-slate-400 border-slate-800'
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
                    className="w-full py-2.5 px-4 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Cadastrar Atleta
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Atletas Registrados ({allProfiles.length})
              </h3>
              <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-800/60 p-4 rounded-xl bg-slate-900 border border-slate-800">
                {allProfiles.map((p) => {
                  const archList = p.archetypes && p.archetypes.length > 0 ? p.archetypes : [p.archetype || 'Mágico'];
                  return (
                    <div key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-200">{p.name}</span>
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
                        className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                      >
                        Perfil <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Modal Lightbox de Inspeção de Comprovante */}
        {inspectingMatch && inspectingMatch.proof_image_url && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-100">
                    Inspeção de Súmula Oficial EA FC 26
                  </h4>
                  <p className="text-xs text-slate-400">
                    {inspectingMatch.home_team?.name} ({inspectingMatch.home_score}) x ({inspectingMatch.away_score}) {inspectingMatch.away_team?.name}
                  </p>
                </div>
                <button
                  onClick={() => setInspectingMatch(null)}
                  className="text-slate-500 hover:text-slate-200 p-1"
                >
                  ✕
                </button>
              </div>

              <div className="rounded-md overflow-hidden border border-slate-800 bg-slate-950 max-h-[60vh] flex items-center justify-center">
                <img
                  src={inspectingMatch.proof_image_url}
                  alt="Comprovante de tela cheia"
                  className="max-h-[60vh] w-auto object-contain"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setInspectingMatch(null)}
                  className="px-4 py-2 rounded-md bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Fechar
                </button>
                <button
                  onClick={() => handleReviewMatch(inspectingMatch.id, 'approved')}
                  className="px-4 py-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5"
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
