'use client';

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { FormationKey, PitchPositionSlot, TournamentPlayerStats } from '@/types/database';
import { FORMATION_PRESETS } from '@/lib/utils';

interface SquadContextType {
  formation: FormationKey;
  setFormation: (formation: FormationKey) => void;
  slots: PitchPositionSlot[];
  assignments: Record<string, TournamentPlayerStats | null>;
  selectedBenchPlayer: TournamentPlayerStats | null;
  setSelectedBenchPlayer: (player: TournamentPlayerStats | null) => void;
  assignPlayerToSlot: (slotId: string, player: TournamentPlayerStats) => void;
  removePlayerFromSlot: (slotId: string) => void;
  autoAssignSquad: (availablePlayers: TournamentPlayerStats[]) => void;
  clearPitch: () => void;
  isPlayerOnPitch: (playerId: string) => boolean;
}

const SquadContext = createContext<SquadContextType | null>(null);

export function SquadProvider({
  children,
  initialFormation = '1-2-1',
}: {
  children: React.ReactNode;
  initialFormation?: FormationKey;
}) {
  const [formation, setFormationState] = useState<FormationKey>(initialFormation);
  const [assignments, setAssignments] = useState<Record<string, TournamentPlayerStats | null>>({});
  const [selectedBenchPlayer, setSelectedBenchPlayer] = useState<TournamentPlayerStats | null>(null);

  const currentPreset = FORMATION_PRESETS[formation] || FORMATION_PRESETS['1-2-1'];
  const slots = currentPreset.slots;

  const setFormation = useCallback((newFormation: FormationKey) => {
    setFormationState(newFormation);
    // Preservar jogadores ao trocar formações se os slots coincidirem
  }, []);

  const assignPlayerToSlot = useCallback((slotId: string, player: TournamentPlayerStats) => {
    setAssignments((prev) => {
      const next = { ...prev };
      // Se o jogador já estava em outro slot, remove do anterior
      Object.keys(next).forEach((k) => {
        if (next[k]?.player_id === player.player_id) {
          next[k] = null;
        }
      });
      next[slotId] = player;
      return next;
    });
    setSelectedBenchPlayer(null);
  }, []);

  const removePlayerFromSlot = useCallback((slotId: string) => {
    setAssignments((prev) => ({
      ...prev,
      [slotId]: null,
    }));
  }, []);

  const clearPitch = useCallback(() => {
    setAssignments({});
  }, []);

  const isPlayerOnPitch = useCallback(
    (playerId: string) => {
      return Object.values(assignments).some((p) => p?.player_id === playerId);
    },
    [assignments]
  );

  const autoAssignSquad = useCallback(
    (availablePlayers: TournamentPlayerStats[]) => {
      const newAssignments: Record<string, TournamentPlayerStats | null> = {};
      const usedPlayerIds = new Set<string>();

      slots.forEach((slot) => {
        // Tentar encontrar o melhor jogador para a posição
        const match = availablePlayers.find(
          (p) =>
            !usedPlayerIds.has(p.player_id) &&
            (p.declared_positions.includes(slot.positionCode) ||
              p.community_position === slot.positionCode)
        );

        if (match) {
          newAssignments[slot.slotId] = match;
          usedPlayerIds.add(match.player_id);
        } else {
          // Fallback qualquer disponível
          const fallback = availablePlayers.find((p) => !usedPlayerIds.has(p.player_id));
          if (fallback) {
            newAssignments[slot.slotId] = fallback;
            usedPlayerIds.add(fallback.player_id);
          }
        }
      });

      setAssignments(newAssignments);
    },
    [slots]
  );

  const value = useMemo(
    () => ({
      formation,
      setFormation,
      slots,
      assignments,
      selectedBenchPlayer,
      setSelectedBenchPlayer,
      assignPlayerToSlot,
      removePlayerFromSlot,
      autoAssignSquad,
      clearPitch,
      isPlayerOnPitch,
    }),
    [
      formation,
      setFormation,
      slots,
      assignments,
      selectedBenchPlayer,
      assignPlayerToSlot,
      removePlayerFromSlot,
      autoAssignSquad,
      clearPitch,
      isPlayerOnPitch,
    ]
  );

  return <SquadContext.Provider value={value}>{children}</SquadContext.Provider>;
}

export function useSquad() {
  const context = useContext(SquadContext);
  if (!context) {
    throw new Error('useSquad deve ser utilizado dentro de um SquadProvider');
  }
  return context;
}
