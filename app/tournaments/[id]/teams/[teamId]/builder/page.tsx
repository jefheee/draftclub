'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { TournamentPlayerStats } from '@/types/database';
import { SquadProvider, useSquad } from '@/components/builder/squad-context';
import { Pitch } from '@/components/builder/pitch';
import { BackButton } from '@/components/ui/back-button';
import { ALL_11V11_FORMATIONS, getEAStatColor, getPositionBadgeClass, cn } from '@/lib/utils';
import { 
  Users, 
  RotateCcw, 
  Wand2, 
  Check, 
  CheckCircle, 
  Save, 
  Award,
  Sparkles,
  AlertCircle
} from 'lucide-react';

function SquadBuilderContent() {
  const params = useParams();
  const tournamentId = (params?.id as string) || '11111111-1111-1111-1111-111111111111';
  const teamId = (params?.teamId as string) || 'b1111111-1111-1111-1111-111111111111';

  const [teamRoster, setTeamRoster] = useState<TournamentPlayerStats[]>([]);
  const [teamName, setTeamName] = useState('Boca Juniors FC');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const {
    formation,
    setFormation,
    slots,
    assignments,
    selectedBenchPlayer,
    setSelectedBenchPlayer,
    autoAssignSquad,
    clearPitch,
    saveLineupToDatabase,
    loadLineupFromDatabase,
    isPlayerOnPitch,
  } = useSquad();

  useEffect(() => {
    async function loadData() {
      try {
        const { data: teamData } = await supabase.from('teams').select('name, active_formation').eq('id', teamId).single();
        if (teamData) {
          setTeamName(teamData.name);
          if (teamData.active_formation) {
            setFormation(teamData.active_formation);
          }
        }

        const { data: statsData } = await supabase
          .from('vw_tournament_player_stats')
          .select('*')
          .eq('tournament_id', tournamentId)
          .eq('drafted_team_id', teamId);

        if (statsData && statsData.length > 0) {
          setTeamRoster(statsData as TournamentPlayerStats[]);
          await loadLineupFromDatabase(tournamentId, teamId, statsData as TournamentPlayerStats[]);
        }
      } catch (err) {
        console.warn('Erro ao carregar time:', err);
      }
    }
    loadData();
  }, [tournamentId, teamId, loadLineupFromDatabase, setFormation]);

  const squadMetrics = useMemo(() => {
    const assignedPlayers = Object.values(assignments).filter(
      (p): p is TournamentPlayerStats => p !== null
    );
    const count = assignedPlayers.length;
    const totalSlots = 11;
    const avgOverall =
      count > 0
        ? Math.round(
            (assignedPlayers.reduce((acc, p) => acc + (p.overall_score || 75), 0) / count) * 10
          ) / 10
        : 0;

    return { count, totalSlots, avgOverall };
  }, [assignments]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    const ok = await saveLineupToDatabase(tournamentId, teamId);
    setIsSaving(false);
    if (ok) {
      setSaveStatus('Escalação tática salva com sucesso!');
      setTimeout(() => setSaveStatus(null), 3000);
    } else {
      setSaveStatus('Falha ao salvar no banco.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <BackButton fallbackHref={`/tournaments/${tournamentId}/draft`} label="Voltar ao Draft" />
              <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                Prancheta Oficial (11v11)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
              Squad Builder — <span className="text-zinc-400 font-normal">{teamName}</span>
            </h1>
          </div>

          {/* Quick Metrics & Save Action */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs gap-3">
              <div className="border-r border-zinc-800 pr-3">
                <span className="text-zinc-500 font-medium mr-1.5">Escalados:</span>
                <span className="font-bold text-zinc-200">{squadMetrics.count}/11</span>
              </div>
              <div>
                <span className="text-zinc-500 font-medium mr-1.5">Média:</span>
                <span className="font-bold text-zinc-200">{squadMetrics.avgOverall > 0 ? squadMetrics.avgOverall : '—'}</span>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="py-2 px-3.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 disabled:opacity-40"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Salvando...' : 'Salvar Tática'}</span>
            </button>
          </div>
        </div>

        {saveStatus && (
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{saveStatus}</span>
          </div>
        )}

        {/* Controls Bar: Formação Oficial EA FC 26 */}
        <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Esquema Tático (EA FC):
            </label>
            <select
              value={formation}
              onChange={(e) => setFormation(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-200 focus:outline-none cursor-pointer"
            >
              <optgroup label="Formações com 4 Defensores">
                {Object.values(ALL_11V11_FORMATIONS)
                  .filter((f) => f.category === '4-defenders')
                  .map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Formações com 5 Defensores">
                {Object.values(ALL_11V11_FORMATIONS)
                  .filter((f) => f.category === '5-defenders')
                  .map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Formações com 3 Defensores">
                {Object.values(ALL_11V11_FORMATIONS)
                  .filter((f) => f.category === '3-defenders')
                  .map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => autoAssignSquad(teamRoster)}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Auto-Escalar</span>
            </button>

            <button
              onClick={clearPitch}
              className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          </div>
        </div>

        {/* Tactical Pitch + Bench Panel */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 flex flex-col items-center">
            {selectedBenchPlayer && (
              <div className="mb-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Clique na posição desejada no campo para escalar <strong>{selectedBenchPlayer.name}</strong></span>
              </div>
            )}
            <Pitch />
          </div>

          {/* Elenco Lateral */}
          <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="border-b border-zinc-800 pb-3">
              <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-zinc-400" />
                Elenco Draftado ({teamRoster.length})
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Clique em um atleta para ativá-lo e depois selecione a posição no campo.
              </p>
            </div>

            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {teamRoster.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs">
                  Nenhum atleta draftado para este time ainda. Acesse o Draft Board.
                </div>
              ) : (
                teamRoster.map((player) => {
                  const onPitch = isPlayerOnPitch(player.player_id);
                  const isSelected = selectedBenchPlayer?.player_id === player.player_id;
                  const statColor = getEAStatColor(player.overall_score || 75);

                  return (
                    <div
                      key={player.player_id}
                      onClick={() => setSelectedBenchPlayer(isSelected ? null : player)}
                      className={cn(
                        'p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between',
                        isSelected
                          ? 'bg-zinc-800 border-zinc-600'
                          : onPitch
                          ? 'bg-zinc-950/40 border-zinc-850 opacity-70'
                          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono text-xs border',
                            statColor.badge
                          )}
                        >
                          {player.overall_score > 0 ? player.overall_score : '75'}
                        </div>

                        <div>
                          <span className="text-xs font-semibold text-zinc-200 block">
                            {player.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                            <Award className="w-2.5 h-2.5 text-zinc-500" />
                            {player.archetype}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <div className="flex gap-1">
                          {player.positions_declared?.slice(0, 2).map((pos) => (
                            <span
                              key={pos}
                              className={cn('text-[9px] font-medium px-1.5 py-0.5 rounded border', getPositionBadgeClass(pos))}
                            >
                              {pos}
                            </span>
                          ))}
                        </div>

                        {onPitch ? (
                          <span className="text-[9px] font-medium text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="w-2.5 h-2.5" /> Titular
                          </span>
                        ) : (
                          <span className="text-[9px] text-zinc-500">
                            {isSelected ? 'Posicionar ↵' : 'Banco'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeamSquadBuilderPage() {
  return (
    <SquadProvider initialFormation="4-3-3">
      <SquadBuilderContent />
    </SquadProvider>
  );
}
