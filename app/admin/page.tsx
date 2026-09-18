'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tournament, PlayerProfile, TournamentParticipant, ParticipantRole } from '@/types/database';
import { BackButton } from '@/components/ui/back-button';
import { Shield, Plus, Users, Trophy, Crown, Check, AlertCircle, RefreshCw, UserPlus } from 'lucide-react';
import { getPositionBadgeClass, cn } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [participants, setParticipants] = useState<(TournamentParticipant & { player_name?: string; positions?: string[] })[]>([]);
  const [allProfiles, setAllProfiles] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [newTournName, setNewTournName] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerArchetype, setNewPlayerArchetype] = useState('Polivalente');
  const [newPlayerPositions, setNewPlayerPositions] = useState('VOL, MEI');

  useEffect(() => {
    async function initData() {
      setLoading(true);
      try {
        const { data: tData } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false });
        if (tData && tData.length > 0) {
          setTournaments(tData);
          setSelectedTournamentId(tData[0].id);
        }

        const { data: pData } = await supabase.from('player_profiles').select('*').order('name');
        if (pData) setAllProfiles(pData);
      } catch (e) {
        console.warn('Erro ao carregar dados do admin:', e);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  useEffect(() => {
    if (!selectedTournamentId) return;

    async function loadParticipants() {
      try {
        const { data } = await supabase
          .from('tournament_participants')
          .select('*, player_profiles(name, positions_declared, archetype)')
          .eq('tournament_id', selectedTournamentId);

        if (data) {
          const mapped = data.map((item: any) => ({
            ...item,
            player_name: item.player_profiles?.name || 'Desconhecido',
            positions: item.player_profiles?.positions_declared || [],
          }));
          setParticipants(mapped);
        }
      } catch (e) {
        console.warn('Erro ao carregar participantes:', e);
      }
    }
    loadParticipants();
  }, [selectedTournamentId]);

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTournName.trim()) return;

    setSaving(true);
    setNotice(null);
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .insert({
          name: newTournName.trim(),
          format: '11v11',
          status: 'REGISTRATION',
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setTournaments((prev) => [data, ...prev]);
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

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    setSaving(true);
    setNotice(null);
    try {
      const positionsArray = newPlayerPositions.split(',').map((p) => p.trim().toUpperCase()).filter(Boolean);
      const { data: profile, error } = await supabase
        .from('player_profiles')
        .insert({
          name: newPlayerName.trim(),
          archetype: newPlayerArchetype.trim(),
          positions_declared: positionsArray,
        })
        .select()
        .single();

      if (error) throw error;

      if (profile) {
        setAllProfiles((prev) => [...prev, profile]);

        // Inscreve no torneio selecionado se houver
        if (selectedTournamentId) {
          await supabase.from('tournament_participants').insert({
            tournament_id: selectedTournamentId,
            player_id: profile.id,
            role: 'player',
          });

          setParticipants((prev) => [
            ...prev,
            {
              id: 'temp-' + Date.now(),
              tournament_id: selectedTournamentId,
              player_id: profile.id,
              role: 'player',
              created_at: new Date().toISOString(),
              player_name: profile.name,
              positions: profile.positions_declared,
            },
          ]);
        }

        setNewPlayerName('');
        setNotice({ type: 'success', text: `Perfil do atleta "${profile.name}" registrado e inscrito!` });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Erro ao cadastrar atleta.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (participantId: string, newRole: ParticipantRole) => {
    try {
      await supabase
        .from('tournament_participants')
        .update({ role: newRole })
        .eq('id', participantId);

      setParticipants((prev) =>
        prev.map((p) => (p.id === participantId ? { ...p, role: newRole } : p))
      );
      setNotice({ type: 'success', text: 'Cargo do participante atualizado com sucesso!' });
    } catch (err: any) {
      setNotice({ type: 'error', text: 'Falha ao atualizar cargo do participante.' });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Minimalista */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <BackButton fallbackHref="/" label="Home" />
              <span className="px-2.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                Módulo Master
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
              Painel de Administração
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Gestão multi-tenant de campeonatos, credenciamento e nomeação de capitães.
            </p>
          </div>
        </div>

        {notice && (
          <div
            className={cn(
              'p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2.5',
              notice.type === 'success'
                ? 'bg-zinc-900 border-emerald-800/60 text-emerald-300'
                : 'bg-zinc-900 border-rose-800/60 text-rose-300'
            )}
          >
            {notice.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
        )}

        {/* Top Controls: Criar Torneio e Cadastrar Atleta */}
        <div className="grid md:grid-cols-2 gap-5">
          {/* Card: Criar Novo Torneio */}
          <form
            onSubmit={handleCreateTournament}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
              <Trophy className="w-4 h-4 text-zinc-400" />
              <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                Novo Campeonato (11v11)
              </h2>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Nome da Liga / Torneio</label>
              <input
                type="text"
                placeholder="Ex: Superliga EA FC Pro 2026"
                value={newTournName}
                onChange={(e) => setNewTournName(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !newTournName.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-40"
            >
              Criar Campeonato
            </button>
          </form>

          {/* Card: Cadastrar Perfil de Atleta */}
          <form
            onSubmit={handleCreatePlayer}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
              <UserPlus className="w-4 h-4 text-zinc-400" />
              <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                Cadastrar Novo Atleta
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-medium">Nome do Jogador</label>
                <input
                  type="text"
                  placeholder="Ex: Neymar Jr"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-medium">Arquétipo</label>
                <input
                  type="text"
                  placeholder="Ex: O Bruxo, Maestro"
                  value={newPlayerArchetype}
                  onChange={(e) => setNewPlayerArchetype(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-medium">Posições Declaradas (separadas por vírgula)</label>
              <input
                type="text"
                placeholder="Ex: PE, MEI, ATA"
                value={newPlayerPositions}
                onChange={(e) => setNewPlayerPositions(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !newPlayerName.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-40"
            >
              Salvar Perfil de Atleta
            </button>
          </form>
        </div>

        {/* Gerenciamento de Participantes e Atribuição de Capitães */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider">
                Participantes & Cargos do Torneio
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Defina quais jogadores têm privilégio de Capitão (acesso ao Draft Board e Squad Builder).
              </p>
            </div>

            {/* Seletor de Torneio */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-medium">Torneio:</span>
              <select
                value={selectedTournamentId}
                onChange={(e) => setSelectedTournamentId(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 font-medium focus:outline-none"
              >
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.format})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  <th className="py-3 px-3">Atleta</th>
                  <th className="py-3 px-3">Posições Declaradas</th>
                  <th className="py-3 px-3">Cargo Atual</th>
                  <th className="py-3 px-3 text-right">Alterar Cargo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-xs">
                {participants.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-500">
                      Nenhum atleta inscrito neste torneio ainda.
                    </td>
                  </tr>
                ) : (
                  participants.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-950/40 transition-colors">
                      <td className="py-3 px-3 font-medium text-zinc-200">
                        {p.player_name}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {p.positions?.map((pos) => (
                            <span
                              key={pos}
                              className={cn('text-[10px] font-semibold px-2 py-0.5 rounded border', getPositionBadgeClass(pos))}
                            >
                              {pos}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border',
                            p.role === 'admin'
                              ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                              : p.role === 'captain'
                              ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                              : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                          )}
                        >
                          {p.role === 'captain' && <Crown className="w-3 h-3 text-amber-400" />}
                          {p.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleRoleChange(p.id, 'player')}
                            className={cn(
                              'px-2 py-1 rounded-md text-[10px] font-medium border transition-colors',
                              p.role === 'player'
                                ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                            )}
                          >
                            Jogador
                          </button>
                          <button
                            onClick={() => handleRoleChange(p.id, 'captain')}
                            className={cn(
                              'px-2 py-1 rounded-md text-[10px] font-medium border transition-colors',
                              p.role === 'captain'
                                ? 'bg-amber-950/60 text-amber-300 border-amber-700'
                                : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-amber-300'
                            )}
                          >
                            Capitão
                          </button>
                          <button
                            onClick={() => handleRoleChange(p.id, 'admin')}
                            className={cn(
                              'px-2 py-1 rounded-md text-[10px] font-medium border transition-colors',
                              p.role === 'admin'
                                ? 'bg-zinc-700 text-zinc-100 border-zinc-600'
                                : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-zinc-200'
                            )}
                          >
                            Admin
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
