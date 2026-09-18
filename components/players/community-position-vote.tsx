'use client';

import React, { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { getPositionBadgeClass, cn } from '@/lib/utils';
import { Users, Check, AlertTriangle } from 'lucide-react';

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

  const totalVotes = useMemo(() => votes.reduce((acc, curr) => acc + curr.count, 0), [votes]);

  const breakdown = useMemo(() => {
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
  const hasDivergence = topVoted && !declaredPositions.includes(topVoted.position);

  const handleVote = async (position: string) => {
    if (isSubmitting || userVotedPosition === position) return;
    setIsSubmitting(true);

    try {
      await supabase.from('position_votes').insert({ player_id: playerId, voted_position: position });
    } catch (e) {
      console.warn('Fallback voto local.', e);
    }

    setVotes((prev) => {
      const existing = prev.find((v) => v.position === position);
      if (existing) {
        return prev.map((v) => (v.position === position ? { ...v, count: v.count + 1 } : v));
      }
      return [...prev, { position, count: 1 }];
    });

    setUserVotedPosition(position);
    setIsSubmitting(false);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-200">Community Position Check</h3>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            A comunidade vota na posição em que o atleta realmente rende mais em jogo.
          </p>
        </div>

        <div className="text-xs font-mono text-zinc-500 bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-800">
          {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}
        </div>
      </div>

      {hasDivergence && topVoted && (
        <div className="p-3 bg-zinc-950 border border-amber-900/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
          <div>
            <span className="font-semibold">Divergência detectada: </span>
            O atleta declarou <span className="font-semibold">[{declaredPositions.join(', ')}]</span>, mas{' '}
            <span className="font-semibold">{topVoted.percentage}%</span> da comunidade avalia que sua posição real é{' '}
            <span className="font-semibold underline">[{topVoted.position}]</span>.
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="bg-zinc-950/70 border border-zinc-800 p-3 rounded-xl">
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block mb-1.5">
            Posições Declaradas
          </span>
          <div className="flex flex-wrap gap-1">
            {declaredPositions.map((pos) => (
              <span key={pos} className={cn('text-xs font-medium px-2 py-0.5 rounded border', getPositionBadgeClass(pos))}>
                {pos}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800 p-3 rounded-xl">
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block mb-1.5">
            Consenso Comunitário
          </span>
          {topVoted ? (
            <div className="flex items-center gap-2">
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded border', getPositionBadgeClass(topVoted.position))}>
                {topVoted.position}
              </span>
              <span className="text-xs font-mono font-medium text-emerald-400">
                {topVoted.percentage}% de votos
              </span>
            </div>
          ) : (
            <span className="text-xs text-zinc-500">Sem votos.</span>
          )}
        </div>
      </div>

      <div className="space-y-2 pt-1">
        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">
          Distribuição dos Votos
        </span>
        {breakdown.map((item) => (
          <div key={item.position} className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-medium text-zinc-300">{item.position}</span>
              <span className="text-zinc-500">{item.percentage}% ({item.count})</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  declaredPositions.includes(item.position) ? 'bg-zinc-400' : 'bg-amber-600'
                )}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-zinc-800/60">
        <span className="text-[11px] font-medium text-zinc-400 block mb-2">
          Votar na posição real deste atleta:
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
                  'px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1',
                  isSelected
                    ? 'bg-zinc-100 text-zinc-950 border-white font-bold'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
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
