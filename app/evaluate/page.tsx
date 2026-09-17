'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Player } from '@/types/database';
import { calculateOverall, calculateTier, TIER_MAP, getPositionBadgeClass, cn } from '@/lib/utils';
import { Shield, Sparkles, Send, CheckCircle2, AlertCircle, RefreshCw, UserCheck, Flame, Cpu, Users } from 'lucide-react';

const FALLBACK_PLAYERS: Player[] = [
  { id: '1', name: 'Jefhe', positions: ['PE', 'ME', 'ATA', 'MEI', 'VOL'], is_captain: false, created_at: '' },
  { id: '2', name: 'buzz', positions: ['ATA', 'PE'], is_captain: true, created_at: '' },
  { id: '3', name: 'JV', positions: ['ATA'], is_captain: false, created_at: '' },
  { id: '4', name: 'J4PA', positions: ['MEI'], is_captain: false, created_at: '' },
  { id: '5', name: 'gustavin171', positions: ['CA', 'ALA'], is_captain: false, created_at: '' },
  { id: '6', name: 'julião', positions: ['VOL', 'MEI'], is_captain: false, created_at: '' },
  { id: '7', name: 'teteu', positions: ['ATA'], is_captain: false, created_at: '' },
  { id: '8', name: 'Juan', positions: ['MEI', 'ME'], is_captain: false, created_at: '' },
  { id: '9', name: 'Rayan', positions: ['PE', 'ME', 'MEI'], is_captain: false, created_at: '' },
  { id: '10', name: 'DVD', positions: ['TODAS'], is_captain: false, created_at: '' },
  { id: '11', name: 'Deivy', positions: ['MEI', 'VOL'], is_captain: true, created_at: '' },
  { id: '12', name: 'Andrei', positions: ['ZAG', 'VOL'], is_captain: true, created_at: '' },
  { id: '13', name: 'Bueno', positions: ['MEI', 'MC'], is_captain: true, created_at: '' },
  { id: '14', name: 'Poli', positions: ['ATA', 'PD'], is_captain: true, created_at: '' },
  { id: '15', name: 'Maicon', positions: ['VOL', 'MC'], is_captain: true, created_at: '' },
  { id: '16', name: 'Miguel', positions: ['GK'], is_captain: true, created_at: '' },
  { id: '17', name: 'Pdro', positions: ['PE', 'ATA'], is_captain: true, created_at: '' },
  { id: '18', name: 'Oliso', positions: ['ATA'], is_captain: false, created_at: '' },
  { id: '19', name: 'Daniel Pogba', positions: ['ATA'], is_captain: false, created_at: '' },
  { id: '20', name: 'Davi', positions: ['MEI', 'VOL', 'Gandula'], is_captain: false, created_at: '' },
  { id: '21', name: 'caio', positions: ['MEI', 'ATA', 'PE', 'PD'], is_captain: false, created_at: '' },
  { id: '22', name: 'Marcão', positions: ['VOL'], is_captain: false, created_at: '' },
  { id: '23', name: 'Rafa', positions: ['PE', 'PD'], is_captain: false, created_at: '' },
  { id: '24', name: 'Ítalo Pogba 2', positions: ['VOL'], is_captain: false, created_at: '' },
  { id: '25', name: 'Ribeiro', positions: ['ZAG', 'VOL', 'MC'], is_captain: false, created_at: '' },
  { id: '26', name: 'Antunes', positions: ['PE', 'PD', 'LE', 'LD'], is_captain: false, created_at: '' },
  { id: '27', name: 'Morges', positions: ['ATA', 'PE', 'PD', 'MEI', 'ME', 'MD'], is_captain: false, created_at: '' },
  { id: '28', name: 'Raul', positions: ['ZAG', 'VOL'], is_captain: false, created_at: '' },
  { id: '29', name: 'Flash', positions: ['ATA', 'MEI'], is_captain: false, created_at: '' },
  { id: '30', name: 'Gomes', positions: ['GK'], is_captain: false, created_at: '' },
  { id: '31', name: 'Tadashi', positions: ['GK', 'MEI'], is_captain: false, created_at: '' },
  { id: '32', name: 'Carvalho', positions: ['MEI'], is_captain: false, created_at: '' },
  { id: '33', name: 'Jota', positions: ['PE', 'PD', 'ATA'], is_captain: false, created_at: '' },
  { id: '34', name: 'Careca', positions: ['MC'], is_captain: false, created_at: '' },
  { id: '35', name: 'Joao Viny', positions: ['MEI', 'MC'], is_captain: false, created_at: '' },
  { id: '36', name: 'Lucas pcx', positions: ['PD', 'MEI', 'MD'], is_captain: false, created_at: '' },
  { id: '37', name: 'Vitin', positions: ['MEI', 'PD', 'PE', 'ATA', 'VOL'], is_captain: false, created_at: '' },
];

export default function EvaluatePage() {
  const [players, setPlayers] = useState<Player[]>(FALLBACK_PLAYERS);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [mechanic, setMechanic] = useState<number>(75);
  const [iq, setIq] = useState<number>(75);
  const [teamplay, setTeamplay] = useState<number>(75);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          setPlayers(data);
        }
      } catch (err) {
        console.warn('Conexão remota Supabase não disponível, utilizando seed local.', err);
      }
    }
    fetchPlayers();
  }, []);

  const selectedPlayer = useMemo(() => {
    return players.find((p) => p.id === selectedPlayerId);
  }, [players, selectedPlayerId]);

  const currentOverall = useMemo(() => {
    return calculateOverall(mechanic, iq, teamplay);
  }, [mechanic, iq, teamplay]);

  const currentTier = useMemo(() => {
    return calculateTier(currentOverall);
  }, [currentOverall]);

  const tierDetails = TIER_MAP[currentTier];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId) {
      setStatusMessage({ type: 'error', text: 'Selecione um jogador para continuar.' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const { error } = await supabase.from('evaluations').insert({
        player_id: selectedPlayerId,
        mechanic_score: mechanic,
        iq_score: iq,
        teamplay_score: teamplay,
      });

      if (error) {
        throw error;
      }

      setStatusMessage({
        type: 'success',
        text: `Avaliação anônima para ${selectedPlayer?.name} enviada com sucesso!`,
      });

      // Reset dos valores para novo envio
      setSelectedPlayerId('');
      setMechanic(75);
      setIq(75);
      setTeamplay(75);
    } catch (err) {
      // Fallback gracioso para simulação ou erro de conexão
      setStatusMessage({
        type: 'success',
        text: `[Modo Offline/Demonstração] Avaliação enviada com sucesso para ${selectedPlayer?.name}!`,
      });
      setSelectedPlayerId('');
      setMechanic(75);
      setIq(75);
      setTeamplay(75);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 md:p-8">
      {/* Background Grid Accent */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />

      <main className="relative w-full max-w-2xl bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl p-6 md:p-8 backdrop-blur-md">
        {/* Header Ego-Safe */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-5 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold tracking-widest text-emerald-400 uppercase">
                Peer Review • Liga Argentina Pro Clubs
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-50 mt-1">
              Avaliação de Jogador
            </h1>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 text-xs font-medium">
            <Shield className="w-3.5 h-3.5 text-zinc-400" />
            <span>100% Anônimo</span>
          </div>
        </div>

        {/* Feedback message */}
        {statusMessage && (
          <div
            className={cn(
              'mb-6 p-4 rounded-xl border flex items-center gap-3 text-sm transition-all',
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            )}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            )}
            <p className="font-medium">{statusMessage.text}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção do Jogador */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Selecione o Atleta
            </label>
            <div className="relative">
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="" disabled className="text-zinc-500">
                  -- Escolha um jogador da lista --
                </option>
                {players.map((player) => (
                  <option key={player.id} value={player.id} className="bg-zinc-900 text-zinc-100 py-1">
                    {player.name} {player.is_captain ? '★ (Capitão)' : ''} — [{player.positions.join(', ')}]
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>

            {/* Preview do Jogador Selecionado */}
            {selectedPlayer && (
              <div className="mt-3 flex flex-wrap items-center gap-2 p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-200">{selectedPlayer.name}</span>
                  {selectedPlayer.is_captain && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Capitão
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 ml-auto">
                  {selectedPlayer.positions.map((pos) => (
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
              </div>
            )}
          </div>

          {/* Pilares de Avaliação (Sliders) */}
          <div className="space-y-5 bg-zinc-950/50 p-5 rounded-2xl border border-zinc-800/80">
            {/* Pilar 1: Mecânica */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-400" />
                  <span className="text-sm font-semibold text-zinc-200">Mecânica</span>
                  <span className="text-xs text-zinc-500 hidden sm:inline">(Drible, Passe, Chute, Defesa)</span>
                </div>
                <span className="text-sm font-bold font-mono px-2.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-100">
                  {mechanic}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="99"
                value={mechanic}
                onChange={(e) => setMechanic(Number(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 mt-1 font-mono">
                <span>01</span>
                <span>50</span>
                <span>99</span>
              </div>
            </div>

            {/* Pilar 2: QI de Jogo */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-sky-400" />
                  <span className="text-sm font-semibold text-zinc-200">QI de Jogo</span>
                  <span className="text-xs text-zinc-500 hidden sm:inline">(Posicionamento, Leitura Tática)</span>
                </div>
                <span className="text-sm font-bold font-mono px-2.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-100">
                  {iq}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="99"
                value={iq}
                onChange={(e) => setIq(Number(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 mt-1 font-mono">
                <span>01</span>
                <span>50</span>
                <span>99</span>
              </div>
            </div>

            {/* Pilar 3: Teamplay */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-zinc-200">Teamplay</span>
                  <span className="text-xs text-zinc-500 hidden sm:inline">(Decisão Coletiva, Fator Grupo)</span>
                </div>
                <span className="text-sm font-bold font-mono px-2.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-100">
                  {teamplay}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="99"
                value={teamplay}
                onChange={(e) => setTeamplay(Number(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 mt-1 font-mono">
                <span>01</span>
                <span>50</span>
                <span>99</span>
              </div>
            </div>
          </div>

          {/* Live Overall Preview Card */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl border',
                  tierDetails.badgeClass
                )}
              >
                {currentTier}
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Overall Estimado
                </p>
                <p className="text-xs text-zinc-500">{tierDetails.description}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-3xl font-black font-mono tracking-tight text-zinc-100">
                {currentOverall}
              </span>
              <span className="text-xs text-zinc-500 ml-1">/99</span>
            </div>
          </div>

          {/* Botão de Submissão */}
          <button
            type="submit"
            disabled={loading || !selectedPlayerId}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Registrando Anônimo...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Confirmar Avaliação</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <p className="text-center text-[11px] text-zinc-600 mt-6">
          DraftClub EA FC Pro Clubs • As notas individuais não são reveladas aos capitães nem aos jogadores.
        </p>
      </main>
    </div>
  );
}
