'use client';

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PitchPositionSlot, TournamentPlayerStats, FormationPreset } from '@/types/database';
import { ALL_11V11_FORMATIONS } from '@/lib/utils';

interface SquadContextType {
  formation: string;
  setFormation: (formation: string) => void;
  slots: PitchPositionSlot[];
  assignments: Record<string, TournamentPlayerStats | null>;
  selectedBenchPlayer: TournamentPlayerStats | null;
  setSelectedBenchPlayer: (player: TournamentPlayerStats | null) => void;
  assignPlayerToSlot: (slotId: string, player: TournamentPlayerStats) => void;
  removePlayerFromSlot: (slotId: string) => void;
  autoAssignSquad: (availablePlayers: TournamentPlayerStats[]) => void;
  clearPitch: () => void;
  saveLineupToDatabase: (tournamentId: string, teamId: string) => Promise<boolean>;
  isPlayerOnPitch: (playerId: string) => boolean;
  loadLineupFromDatabase: (tournamentId: string, teamId: string, roster: TournamentPlayerStats[]) => Promise<void>;
}

const SquadContext = createContext<SquadContextType | null>(null);

export function SquadProvider({
  children,
  initialFormation = '4-3-3',
}: {
  children: React.ReactNode;
  initialFormation?: string;
}) {
  const [formation, setFormationState] = useState<string>(initialFormation);
  const [assignments, setAssignments] = useState<Record<string, TournamentPlayerStats | null>>({});
  const [selectedBenchPlayer, setSelectedBenchPlayer] = useState<TournamentPlayerStats | null>(null);

  const currentPreset: FormationPreset = ALL_11V11_FORMATIONS[formation] || ALL_11V11_FORMATIONS['4-3-3'];
  const slots = currentPreset.slots;

  const setFormation = useCallback((newFormation: string) => {
    if (ALL_11V11_FORMATIONS[newFormation]) {
      setFormationState(newFormation);
    }
  }, []);

  const assignPlayerToSlot = useCallback((slotId: string, player: TournamentPlayerStats) => {
    setAssignments((prev) => {
      const next = { ...prev };
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
    setAssignments((prev) => ({ ...prev, [slotId]: null }));
  }, []);

  const clearPitch = useCallback(() => setAssignments({}), []);

  const isPlayerOnPitch = useCallback(
    (playerId: string) => Object.values(assignments).some((p) => p?.player_id === playerId),
    [assignments]
  );

  const autoAssignSquad = useCallback(
    (availablePlayers: TournamentPlayerStats[]) => {
      const newAssignments: Record<string, TournamentPlayerStats | null> = {};
      const used = new Set<string>();

      slots.forEach((slot) => {
        const match = availablePlayers.find(
          (p) =>
            !used.has(p.player_id) &&
            (p.positions_declared?.includes(slot.positionCode) ||
              p.community_position === slot.positionCode)
        );

        if (match) {
          newAssignments[slot.slotId] = match;
          used.add(match.player_id);
        } else {
          const fallback = availablePlayers.find((p) => !used.has(p.player_id));
          if (fallback) {
            newAssignments[slot.slotId] = fallback;
            used.add(fallback.player_id);
          }
        }
      });

      setAssignments(newAssignments);
    },
    [slots]
  );

  const saveLineupToDatabase = useCallback(
    async (tournamentId: string, teamId: string): Promise<boolean> => {
      try {
        await supabase
          .from('teams')
          .update({ active_formation: formation })
          .eq('id', teamId);

        const upsertPromises = slots.map((slot) => {
          const assigned = assignments[slot.slotId];
          return supabase.from('squad_lineups').upsert(
            {
              tournament_id: tournamentId,
              team_id: teamId,
              slot_id: slot.slotId,
              position_code: slot.positionCode,
              player_id: assigned ? assigned.player_id : null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'team_id,slot_id' }
          );
        });

        await Promise.all(upsertPromises);
        return true;
      } catch (e) {
        console.warn('Erro ao persistir escalação:', e);
        return false;
      }
    },
    [formation, slots, assignments]
  );

  const loadLineupFromDatabase = useCallback(
    async (tournamentId: string, teamId: string, roster: TournamentPlayerStats[]) => {
      try {
        const { data: teamData } = await supabase
          .from('teams')
          .select('active_formation')
          .eq('id', teamId)
          .single();

        if (teamData?.active_formation && ALL_11V11_FORMATIONS[teamData.active_formation]) {
          setFormationState(teamData.active_formation);
        }

        const { data: lineupData } = await supabase
          .from('squad_lineups')
          .select('*')
          .eq('team_id', teamId);

        if (lineupData && lineupData.length > 0) {
          const loadedAssignments: Record<string, TournamentPlayerStats | null> = {};
          lineupData.forEach((row) => {
            if (row.player_id) {
              const matchedPlayer = roster.find((p) => p.player_id === row.player_id);
              if (matchedPlayer) {
                loadedAssignments[row.slot_id] = matchedPlayer;
              }
            }
          });
          setAssignments(loadedAssignments);
        }
      } catch (e) {
        console.warn('Erro ao carregar escalação salva:', e);
      }
    },
    []
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
      saveLineupToDatabase,
      loadLineupFromDatabase,
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
      saveLineupToDatabase,
      loadLineupFromDatabase,
      isPlayerOnPitch,
    ]
  );

  return <SquadContext.Provider value={value}>{children}</SquadContext.Provider>;
}

export function useSquad() {
  const context = useContext(SquadContext);
  if (!context) throw new Error('useSquad deve ser utilizado dentro de SquadProvider');
  return context;
}
