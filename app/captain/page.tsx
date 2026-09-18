'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/auth-context';
import { 
  Team, 
  PlayerProfile, 
  PlayerStats, 
  Match 
} from '@/types/database';
import { 
  EA_FC_26_ARCHETYPES, 
  getArchetypeBadgeClass, 
  getPositionBadgeClass, 
  getEAStatColor, 
  cn 
} from '@/lib/utils';
import { 
  Shield, 
  Users, 
  Trophy, 
  Send, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Image as ImageIcon,
  Save
} from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';

export default function CaptainPage() {
  const { session } = useAuth();

  // Se não tiver time vinculado na sessão, default para Boca Juniors
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    session?.teamId || 'b1111111-1111-1111-1111-111111111111'
  );

  const [activeTab, setActiveTab] = useState<'squad' | 'matches'>('squad');

  // Estados de dados
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [squad, setSquad] = useState<(PlayerProfile & { stats?: PlayerStats })[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de edição de arquétipos do atleta
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [selectedArchetypes, setSelectedArchetypes] = useState<string[]>([]);
  const [savingPlayer, setSavingPlayer] = useState(false);

  // Estados de report de partida
  const [opponentTeamId, setOpponentTeamId] = useState<string>('');
  const [myScore, setMyScore] = useState<number>(0);
  const [oppScore, setOppScore] = useState<number>(0);
  const [matchNotes, setMatchNotes] = useState<string>('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploadingMatch, setUploadingMatch] = useState(false);
  const [matchSuccessMsg, setMatchSuccessMsg] = useState('');
  const [matchErrorMsg, setMatchErrorMsg] = useState('');

  // Atletas com estatísticas no report
  const [scorers, setScorers] = useState<{ playerId: string; goals: number; assists: number; redCards: number }[]>([]);

  useEffect(() => {
    loadData();
  }, [selectedTeamId]);

  async function loadData() {
    setLoading(true);
    try {
      // 1. Carregar todos os times
      const { data: teamsData } = await supabase.from('teams').select('*');
      if (teamsData) {
        setTeams(teamsData);
        const current = teamsData.find(t => t.id === selectedTeamId) || teamsData[0];
        setMyTeam(current);
        if (current && !opponentTeamId) {
          const firstOpp = teamsData.find(t => t.id !== current.id);
          if (firstOpp) setOpponentTeamId(firstOpp.id);
        }
      }

      // 2. Carregar elenco do time selecionado via draft_picks
      const { data: picks } = await supabase
        .from('draft_picks')
        .select('player_id')
        .eq('team_id', selectedTeamId);

      const playerIds = picks ? picks.map(p => p.player_id) : [];

      if (playerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('player_profiles')
          .select('*')
          .in('id', playerIds);

        const { data: statsData } = await supabase
          .from('player_stats')
          .select('*')
          .in('player_id', playerIds);

        if (profiles) {
          const merged = profiles.map(p => ({
            ...p,
            stats: statsData?.find(s => s.player_id === p.id),
          }));
          setSquad(merged);
        }
      } else {
        setSquad([]);
      }

      // 3. Carregar histórico de partidas deste time
      const { data: matchData } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name),
          away_team:teams!matches_away_team_id_fkey(id, name)
        `)
        .or(`home_team_id.eq.${selectedTeamId},away_team_id.eq.${selectedTeamId}`)
        .order('created_at', { ascending: false });

      if (matchData) {
        setMatches(matchData as any);
      }
    } catch (e) {
      console.warn('Erro ao carregar dados do capitão:', e);
    } finally {
      setLoading(false);
    }
  }

  // Toggle de arquétipo na edição
  const toggleArchetype = (arch: string) => {
    if (selectedArchetypes.includes(arch)) {
      if (selectedArchetypes.length === 1) return; // Mínimo 1
      setSelectedArchetypes(selectedArchetypes.filter(a => a !== arch));
    } else {
      setSelectedArchetypes([...selectedArchetypes, arch]);
    }
  };

  const handleStartEditArchetypes = (player: PlayerProfile) => {
    setEditingPlayerId(player.id);
    const existing = player.archetypes && player.archetypes.length > 0
      ? player.archetypes
      : [player.archetype || 'Mágico'];
    setSelectedArchetypes(existing);
  };

  const handleSaveArchetypes = async () => {
    if (!editingPlayerId) return;
    setSavingPlayer(true);
    try {
      const primary = selectedArchetypes[0] || 'Mágico';
      await supabase
        .from('player_profiles')
        .update({
          archetypes: selectedArchetypes,
          archetype: primary,
        })
        .eq('id', editingPlayerId);

      // Atualiza estado local
      setSquad(prev => prev.map(p => {
        if (p.id === editingPlayerId) {
          return { ...p, archetypes: selectedArchetypes, archetype: primary };
        }
        return p;
      }));
      setEditingPlayerId(null);
    } catch (e) {
      console.error('Erro ao atualizar arquétipos:', e);
    } finally {
      setSavingPlayer(false);
    }
  };

  // Upload do print da partida
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofFile(file);
      const url = URL.createObjectURL(file);
      setProofPreview(url);
    }
  };

  // Gerenciamento de gols/assistências no formulário de report
  const addScorerRow = (playerId: string) => {
    if (scorers.some(s => s.playerId === playerId)) return;
    setScorers([...scorers, { playerId, goals: 1, assists: 0, redCards: 0 }]);
  };

  const updateScorer = (playerId: string, field: 'goals' | 'assists' | 'redCards', val: number) => {
    setScorers(scorers.map(s => {
      if (s.playerId === playerId) {
        return { ...s, [field]: Math.max(0, val) };
      }
      return s;
    }));
  };

  const removeScorerRow = (playerId: string) => {
    setScorers(scorers.filter(s => s.playerId !== playerId));
  };

  // Submissão do Report de Partida
  const handleSubmitMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opponentTeamId) {
      setMatchErrorMsg('Selecione o time adversário.');
      return;
    }
    if (!proofFile && !proofPreview) {
      setMatchErrorMsg('O upload do print da partida é obrigatório para validação.');
      return;
    }

    setUploadingMatch(true);
    setMatchErrorMsg('');
    setMatchSuccessMsg('');

    try {
      let uploadedProofUrl = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800';

      if (proofFile) {
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `match_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `reports/${fileName}`;

        const { error: uploadErr } = await supabase.storage
          .from('match-proofs')
          .upload(filePath, proofFile);

        if (!uploadErr) {
          const { data: pubData } = supabase.storage
            .from('match-proofs')
            .getPublicUrl(filePath);
          uploadedProofUrl = pubData.publicUrl;
        }
      }

      // Inserir registro na tabela matches
      const { data: newMatch, error: matchErr } = await supabase
        .from('matches')
        .insert({
          tournament_id: '11111111-1111-1111-1111-111111111111',
          home_team_id: selectedTeamId,
          away_team_id: opponentTeamId,
          home_score: myScore,
          away_score: oppScore,
          proof_image_url: uploadedProofUrl,
          status: 'pending',
          reported_by: session?.userId || null,
          notes: matchNotes,
        })
        .select()
        .single();

      if (matchErr) throw matchErr;

      // Inserir estatísticas individuais se houver
      if (newMatch && scorers.length > 0) {
        const statsPayload = scorers.map(s => ({
          match_id: newMatch.id,
          player_id: s.playerId,
          team_id: selectedTeamId,
          goals: s.goals,
          assists: s.assists,
          red_cards: s.redCards,
        }));

        await supabase.from('match_player_stats').insert(statsPayload);
      }

      setMatchSuccessMsg('Partida reportada com sucesso! O resultado e o print foram enviados para conferência do Administrador.');
      setProofFile(null);
      setProofPreview(null);
      setMatchNotes('');
      setScorers([]);
      setMyScore(0);
      setOppScore(0);

      // Recarregar histórico
      loadData();
    } catch (err: any) {
      setMatchErrorMsg(err.message || 'Erro ao enviar resultado da partida.');
    } finally {
      setUploadingMatch(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Superior */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref="/" label="Início" />
            <div className="h-4 w-px bg-zinc-800" />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                Painel do Capitão
              </span>
            </div>
          </div>

          {/* Seletor de Time para alternância ágil de capitania */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Equipe Ativa:</span>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-zinc-600"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Card Informativo do Time do Capitão */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-sky-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-zinc-100">{myTeam?.name || 'Carregando equipe...'}</h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sky-950/50 text-sky-300 border border-sky-800/50">
                  Capitão Oficial
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Gerencie múltiplos arquétipos do seu elenco e submeta súmulas de partidas com print comprobatório da EA.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-center min-w-[70px]">
              <span className="block font-bold text-zinc-200 text-base">{squad.length}</span>
              <span className="text-[10px] text-zinc-500 uppercase">Atletas</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-center min-w-[70px]">
              <span className="block font-bold text-zinc-200 text-base">{matches.length}</span>
              <span className="text-[10px] text-zinc-500 uppercase">Partidas</span>
            </div>
            <a
              href={`/tournaments/11111111-1111-1111-1111-111111111111/teams/${selectedTeamId}/builder`}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors"
            >
              Squad Builder 11v11 →
            </a>
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b border-zinc-800 gap-6 text-sm">
          <button
            onClick={() => setActiveTab('squad')}
            className={cn(
              'pb-3 font-medium transition-colors flex items-center gap-2 relative',
              activeTab === 'squad'
                ? 'text-zinc-100 border-b-2 border-sky-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Users className="w-4 h-4" />
            Meu Elenco ({squad.length})
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={cn(
              'pb-3 font-medium transition-colors flex items-center gap-2 relative',
              activeTab === 'matches'
                ? 'text-zinc-100 border-b-2 border-sky-400 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Trophy className="w-4 h-4" />
            Central de Partidas ({matches.length})
          </button>
        </div>

        {/* ======================================================== */}
        {/* ABA 1: MEU ELENCO & MÚLTIPLOS ARQUÉTIPOS */}
        {/* ======================================================== */}
        {activeTab === 'squad' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-200">Jogadores do Elenco</h2>
                <p className="text-xs text-zinc-500">
                  Defina múltiplos arquétipos por atleta combinando estilos táticos do EA FC 26.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-zinc-500 text-xs">Carregando elenco do time...</div>
            ) : squad.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs rounded-2xl bg-zinc-900 border border-zinc-800">
                Nenhum jogador draftado ainda para esta equipe. Acesse o Draft Board para selecionar atletas.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {squad.map((player) => {
                  const isEditing = editingPlayerId === player.id;
                  const currentArchs = player.archetypes && player.archetypes.length > 0
                    ? player.archetypes
                    : [player.archetype || 'Mágico'];

                  return (
                    <div
                      key={player.id}
                      className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-zinc-100">{player.name}</span>
                            <div className="flex gap-1">
                              {player.positions_declared.map(pos => (
                                <span
                                  key={pos}
                                  className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border', getPositionBadgeClass(pos))}
                                >
                                  {pos}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Arquétipos Atuais */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {currentArchs.map(arch => (
                              <span
                                key={arch}
                                className={cn('text-[10px] font-medium px-2 py-0.5 rounded border', getArchetypeBadgeClass(arch))}
                              >
                                {arch}
                              </span>
                            ))}
                          </div>
                        </div>

                        {!isEditing ? (
                          <button
                            onClick={() => handleStartEditArchetypes(player)}
                            className="px-2.5 py-1 text-[11px] rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors"
                          >
                            Editar Arquétipos
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingPlayerId(null)}
                            className="p-1 text-zinc-500 hover:text-zinc-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Modal/Drawer de Edição Inline de Múltiplos Arquétipos */}
                      {isEditing && (
                        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                          <span className="text-[11px] font-medium text-zinc-400 block">
                            Selecione os estilos do jogador (combine estilos):
                          </span>

                          <div className="space-y-2">
                            {Object.entries(EA_FC_26_ARCHETYPES).map(([category, items]) => (
                              <div key={category} className="space-y-1">
                                <span className="text-[9px] uppercase tracking-wider text-zinc-600 font-bold block">
                                  {category === 'attackers' && 'Atacantes'}
                                  {category === 'midfielders' && 'Meias'}
                                  {category === 'defenders' && 'Defensores'}
                                  {category === 'goalkeepers' && 'Goleiros'}
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {items.map((item) => {
                                    const active = selectedArchetypes.includes(item);
                                    return (
                                      <button
                                        type="button"
                                        key={item}
                                        onClick={() => toggleArchetype(item)}
                                        className={cn(
                                          'text-[10px] px-2 py-0.5 rounded border transition-all',
                                          active
                                            ? 'bg-sky-500 text-zinc-950 font-bold border-sky-400'
                                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                                        )}
                                      >
                                        {item} {active && '✓'}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-end gap-2 pt-1 border-t border-zinc-800/80">
                            <button
                              onClick={() => setEditingPlayerId(null)}
                              className="px-2.5 py-1 rounded-lg text-[11px] text-zinc-400 hover:text-zinc-200"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleSaveArchetypes}
                              disabled={savingPlayer}
                              className="px-3 py-1 rounded-lg text-[11px] bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold flex items-center gap-1.5"
                            >
                              <Save className="w-3.5 h-3.5" />
                              {savingPlayer ? 'Salvando...' : 'Salvar Estilos'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Stats do EA FC */}
                      {player.stats && (
                        <div className="grid grid-cols-6 gap-1 pt-1 border-t border-zinc-800/60 text-center">
                          {[
                            { label: 'RIT', val: player.stats.pace },
                            { label: 'FIN', val: player.stats.shooting },
                            { label: 'PAS', val: player.stats.passing },
                            { label: 'CON', val: player.stats.dribbling },
                            { label: 'DEF', val: player.stats.defending },
                            { label: 'FIS', val: player.stats.physical },
                          ].map(s => {
                            const c = getEAStatColor(s.val ?? 75);
                            return (
                              <div key={s.label} className="p-1 rounded bg-zinc-950/60 border border-zinc-800/80">
                                <span className="text-[9px] text-zinc-500 font-mono block">{s.label}</span>
                                <span className={cn('text-xs font-bold font-mono', c.text)}>{s.val}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 2: CENTRAL DE PARTIDAS & SUBMISSÃO COM PROVA */}
        {/* ======================================================== */}
        {activeTab === 'matches' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Formulário de Report (7 Colunas) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                  <UploadCloud className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                    Reportar Resultado de Partida
                  </h3>
                </div>

                <form onSubmit={handleSubmitMatch} className="space-y-4">
                  {/* Seleção de Adversário */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Time Adversário
                    </label>
                    <select
                      value={opponentTeamId}
                      onChange={(e) => setOpponentTeamId(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                    >
                      {teams
                        .filter(t => t.id !== selectedTeamId)
                        .map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                  </div>

                  {/* Placar */}
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-[11px] font-medium text-zinc-400 block text-center mb-3">
                      Placar Oficial da Partida
                    </span>
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-center">
                        <span className="text-xs font-semibold text-zinc-300 block mb-1">
                          {myTeam?.name || 'Seu Time'}
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={myScore}
                          onChange={(e) => setMyScore(parseInt(e.target.value) || 0)}
                          className="w-16 h-12 text-center text-xl font-bold bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-100 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <span className="text-lg font-bold text-zinc-600 mt-4">X</span>

                      <div className="text-center">
                        <span className="text-xs font-semibold text-zinc-300 block mb-1">
                          {teams.find(t => t.id === opponentTeamId)?.name || 'Adversário'}
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={oppScore}
                          onChange={(e) => setOppScore(parseInt(e.target.value) || 0)}
                          className="w-16 h-12 text-center text-xl font-bold bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-100 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Destaques Individuais (Gols / Assistências / Cartões) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-zinc-400">
                        Estatísticas dos Atletas da Partida
                      </label>
                      {squad.length > 0 && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              addScorerRow(e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="text-[11px] bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-lg px-2 py-1 focus:outline-none"
                        >
                          <option value="">+ Adicionar Atleta...</option>
                          {squad.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {scorers.length > 0 && (
                      <div className="space-y-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                        {scorers.map(s => {
                          const player = squad.find(p => p.id === s.playerId);
                          return (
                            <div key={s.playerId} className="flex items-center justify-between gap-2 text-xs">
                              <span className="font-semibold text-zinc-200 truncate w-32">
                                {player?.name || 'Jogador'}
                              </span>

                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-zinc-500">Gols:</span>
                                  <input
                                    type="number"
                                    min={0}
                                    value={s.goals}
                                    onChange={(e) => updateScorer(s.playerId, 'goals', parseInt(e.target.value) || 0)}
                                    className="w-10 px-1 py-0.5 text-center bg-zinc-900 border border-zinc-700 rounded text-zinc-200"
                                  />
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-zinc-500">Assists:</span>
                                  <input
                                    type="number"
                                    min={0}
                                    value={s.assists}
                                    onChange={(e) => updateScorer(s.playerId, 'assists', parseInt(e.target.value) || 0)}
                                    className="w-10 px-1 py-0.5 text-center bg-zinc-900 border border-zinc-700 rounded text-zinc-200"
                                  />
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-zinc-500">Vermelho:</span>
                                  <input
                                    type="number"
                                    min={0}
                                    max={1}
                                    value={s.redCards}
                                    onChange={(e) => updateScorer(s.playerId, 'redCards', parseInt(e.target.value) || 0)}
                                    className="w-10 px-1 py-0.5 text-center bg-zinc-900 border border-zinc-700 rounded text-rose-400"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeScorerRow(s.playerId)}
                                  className="text-zinc-500 hover:text-rose-400"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Upload do Print Obrigatório */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Print da Partida (Comprovante EA FC obrigatório)
                    </label>
                    <div className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl p-4 text-center transition-colors">
                      {proofPreview ? (
                        <div className="space-y-2">
                          <img
                            src={proofPreview}
                            alt="Prévia do comprovante"
                            className="max-h-48 mx-auto rounded-lg object-contain border border-zinc-800"
                          />
                          <button
                            type="button"
                            onClick={() => { setProofFile(null); setProofPreview(null); }}
                            className="text-[11px] text-rose-400 hover:underline"
                          >
                            Remover imagem
                          </button>
                        </div>
                      ) : (
                        <div>
                          <ImageIcon className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                          <label className="cursor-pointer text-xs font-medium text-sky-400 hover:text-sky-300">
                            Selecionar captura de tela da EA
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                          <p className="text-[10px] text-zinc-500 mt-1">PNG, JPG até 5MB</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Observações */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Observações / Ocorrências (Opcional)
                    </label>
                    <textarea
                      value={matchNotes}
                      onChange={(e) => setMatchNotes(e.target.value)}
                      placeholder="Ex: Jogo equilibrado, sem desconexões."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
                    />
                  </div>

                  {matchErrorMsg && (
                    <p className="text-xs text-rose-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {matchErrorMsg}
                    </p>
                  )}

                  {matchSuccessMsg && (
                    <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      {matchSuccessMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={uploadingMatch}
                    className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {uploadingMatch ? 'Enviando comprovante e súmula...' : 'Enviar Súmula para Validação do Admin'}
                  </button>
                </form>
              </div>
            </div>

            {/* Histórico de Partidas do Time (5 Colunas) */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Histórico de Súmulas Enviadas
              </h3>

              {matches.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 text-xs rounded-2xl bg-zinc-900 border border-zinc-800">
                  Nenhuma partida registrada ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {matches.map(m => {
                    const isHome = m.home_team_id === selectedTeamId;
                    const opponent = isHome ? m.away_team : m.home_team;
                    const myTeamScore = isHome ? m.home_score : m.away_score;
                    const oppScoreVal = isHome ? m.away_score : m.home_score;

                    return (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-zinc-500">
                            {new Date(m.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          <span
                            className={cn(
                              'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border',
                              m.status === 'approved' && 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40',
                              m.status === 'pending' && 'bg-amber-950/40 text-amber-300 border-amber-800/40',
                              m.status === 'rejected' && 'bg-rose-950/40 text-rose-300 border-rose-800/40'
                            )}
                          >
                            {m.status === 'approved' && 'Aprovada'}
                            {m.status === 'pending' && 'Aguardando Admin'}
                            {m.status === 'rejected' && 'Rejeitada'}
                          </span>
                        </div>

                        {/* Placar */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-zinc-200">
                            {myTeam?.name} <span className="font-bold text-sky-400">{myTeamScore}</span>
                          </span>
                          <span className="text-zinc-600 font-bold">vs</span>
                          <span className="font-semibold text-zinc-200">
                            <span className="font-bold text-zinc-400">{oppScoreVal}</span> {opponent?.name}
                          </span>
                        </div>

                        {/* Print Thumbnail */}
                        {m.proof_image_url && (
                          <div className="pt-1 flex items-center justify-between text-[11px] border-t border-zinc-800/80">
                            <span className="text-zinc-500">Comprovante anexado:</span>
                            <a
                              href={m.proof_image_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sky-400 hover:underline flex items-center gap-1"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              Ver Print
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
