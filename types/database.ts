export type Tier = 'S' | 'A' | 'B' | 'C' | 'D' | 'UNRATED';
export type TournamentStatus = 'REGISTRATION' | 'SCOUTING' | 'DRAFT' | 'ACTIVE' | 'FINISHED';
export type ParticipantRole = 'admin' | 'captain' | 'player';

export interface Tournament {
  id: string;
  name: string;
  format: string;
  status: TournamentStatus;
  created_at: string;
}

export interface PlayerProfile {
  id: string;
  user_id?: string;
  name: string;
  positions_declared: string[];
  archetype: string;
  avatar_url?: string;
  created_at: string;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  player_id: string;
  user_id?: string;
  role: ParticipantRole;
  created_at: string;
  player?: PlayerProfile;
}

export interface Player {
  id: string;
  name: string;
  positions: string[];
  is_captain: boolean;
  created_at?: string;
}

export interface PlayerStats {
  id?: string;
  player_id: string;
  name?: string;
  positions?: string[];
  is_captain?: boolean;
  evaluation_count?: number;
  avg_mechanic?: number;
  avg_iq?: number;
  avg_teamplay?: number;
  overall_score?: number;
  tier?: Tier;
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physical?: number;
  build_image_url?: string;
  ocr_extracted_at?: string;
  updated_at?: string;
}

export interface PositionVote {
  id: string;
  player_id: string;
  voter_id: string;
  voted_position: string;
  created_at: string;
}

export interface Evaluation {
  id: string;
  player_id: string;
  tournament_id: string;
  reviewer_id?: string;
  mechanic_score: number;
  iq_score: number;
  teamplay_score: number;
  created_at: string;
}

export interface Team {
  id: string;
  tournament_id: string;
  name: string;
  captain_id?: string;
  active_formation: string;
  logo_url?: string;
  created_at: string;
}

export interface DraftPick {
  id: string;
  tournament_id: string;
  team_id: string;
  player_id: string;
  round: number;
  pick_number: number;
  selected_at: string;
}

export interface SquadLineup {
  id: string;
  tournament_id: string;
  team_id: string;
  slot_id: string;
  position_code: string;
  player_id: string | null;
  updated_at: string;
}

export interface TournamentPlayerStats {
  tournament_id: string;
  player_id: string;
  name: string;
  archetype: string;
  positions_declared: string[];
  community_position: string;
  community_confidence: number;
  total_position_votes: number;
  participant_role: ParticipantRole;
  is_captain: boolean;
  evaluation_count: number;
  avg_mechanic: number;
  avg_iq: number;
  avg_teamplay: number;
  overall_score: number;
  tier: Tier;
  drafted_team_id?: string | null;
  drafted_team_name?: string | null;
  draft_round?: number | null;
  draft_pick_number?: number | null;
}

export interface PitchPositionSlot {
  slotId: string;
  positionCode: string;
  displayName: string;
  xPercent: number; // 0 a 100 da largura do campo
  yPercent: number; // 0 a 100 da altura (90 = GK, 15 = ATA)
  assignedPlayerId?: string | null;
}

export interface FormationPreset {
  key: string;
  label: string;
  category: '4-defenders' | '5-defenders' | '3-defenders';
  slots: PitchPositionSlot[];
}
