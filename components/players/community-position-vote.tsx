'use client';

import React, { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { getPositionBadgeClass, cn } from '@/lib/utils';
import { Users, Check, ThumbsUp, AlertTriangle } from 'lucide-react';

interface VoteBreakdown {
  position: string;
  count: number;
  percentage: number;
}

interface CommunityPositionVoteProps {
  playerId: string;
  declaredPositions: string[];
  initialVotes?: { position: string; count: number }[];
}

const COMMON_POSITIONS = ['ATA', 'PE', 'PD', 'MEI', 'MC', 'VOL', 'LE', 'LD', 'ZAG', 'GK'];

export function CommunityPositionVote({
  playerId,
  declaredPositions,
  initialVotes = [
    { position: 'VOL', count: 8 },
    { position: 'ZAG', count: 3 },
    { position: 'MEI', count: 1 },
  ],
}: CommunityPositionVoteProps) {
  const [votes, setVotes] = useState(initialVotes);
  const [userVotedPosition, setUserVotedPosition] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalVotes = useMemo(() => {
    return votes.reduce((acc, curr) => acc + curr.count, 0);
  }, [votes]);

  const breakdown: VoteBreakdown[] = useMemo(() => {
    if (totalVotes === 0) return [];
    return [...votes]
      .map((v) => ({
        position: v.position,
        count: v.count,
        percentage: Math.round((v.count / totalVotes) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [votes, totalVotes]);

  const topVoted = breakdown[0];

  const hasDivergence = useMemo(() => {
    if (!topVoted) return false;
    return !declaredPositions.includes(topVoted.position);
  }, [topVoted, declaredPositions]);

  const handleVote = async (position: string) => {
    if (isSubmitting || userVotedPosition === position) return;
    setIsSubmitting(true);

    try {
      await supabase.from('position_votes').insert({
        player_id: playerId,
        voted_position: position,
      });
    } catch (e) {
      console.warn('Persistência de voto mock fallback.', e);
    }

    // Atualização otimista
    setVotes((prev) => {
      const existing = prev.find((v) => v.position === position);
      if (existing) {
        return prev.map((v) =>
          v.position === position ? { ...v, count: v.count + 1 } : v
        );
      }
      return [...prev, { position, count: 1 }];
    });

    setUserVotedPosition(position);
    setIsSubmitting(false);
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-zinc-100">
              Community Position Check
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            A comunidade vota na posição em que o atleta realmente rende mais em jogo.
          </p>
        </div>

        <div className="text-xs font-mono text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 self-start sm:self-auto">
          {totalVotes} {totalVotes === 1 ? 'voto computado' : 'votos computados'}
        </div>
      </div>

      {/* Divergence alert banner */}
      {hasDivergence && topVoted && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <span className="font-bold">Atenção Capitães: </span>
            O jogador declarou{' '}
            <span className="font-bold underline">[{declaredPositions.join(', ')}]</span>, mas{' '}
            <span className="font-bold">{topVoted.percentage}%</span> da comunidade avalia que sua posição real é{' '}
            <span className="font-bold underline">[{topVoted.position}]</span>.
          </div>
        </div>
      )}

      {/* Comparison: Declared vs Community */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Declared */}
        <div className="bg-zinc-950/60 border border-zinc-800/80 p-3.5 rounded-xl">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
            Posições Declaradas (Autoavaliação)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {declaredPositions.map((pos) => (
              <span
                key={pos}
                className={cn('text-xs font-bold px-2.5 py-1 rounded border', getPositionBadgeClass(pos))}
              >
                {pos}
              </span>
            ))}
          </div>
        </div>

        {/* Community consensus */}
        <div className="bg-zinc-950/60 border border-zinc-800/80 p-3.5 rounded-xl">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
            Consenso da Comunidade
          </span>
          {topVoted ? (
            <div className="flex items-center gap-2">
              <span className={cn('text-xs font-bold px-2.5 py-1 rounded border', getPositionBadgeClass(topVoted.position))}>
                {topVoted.position}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {topVoted.percentage}% de consenso
              </span>
            </div>
          ) : (
            <span className="text-xs text-zinc-500">Nenhum voto registrado ainda.</span>
          )}
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-2 pt-1">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
          Distribuição dos Votos
        </span>
        {breakdown.map((item) => (
          <div key={item.position} className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-zinc-200">{item.position}</span>
              <span className="text-zinc-400">{item.percentage}% ({item.count})</span>
            </div>
            <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  declaredPositions.includes(item.position) ? 'bg-sky-400' : 'bg-amber-400'
                )}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Vote Selector Buttons */}
      <div className="pt-2">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
          Deixe seu voto na posição real deste atleta:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_POSITIONS.map((pos) => {
            const isSelected = userVotedPosition === pos;
            return (
              <button
                key={pos}
                onClick={() => handleVote(pos)}
                disabled={isSubmitting}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5',
                  isSelected
                    ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-black shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                )}
              >
                {isSelected && <Check className="w-3 h-3" />}
                <span>{pos}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
