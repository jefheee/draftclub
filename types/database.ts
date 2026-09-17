export type Tier = 'S' | 'A' | 'B' | 'C' | 'D' | 'UNRATED';
export type TournamentFormat = '5x5' | '11x11' | '7x7';
export type TournamentStatus = 'REGISTRATION' | 'SCOUTING' | 'DRAFT' | 'ACTIVE' | 'FINISHED';

export interface Tournament {
  id: string;
  name: string;
  format: TournamentFormat;
  status: TournamentStatus;
  max_teams: number;
  created_at: string;
}

export interface Player {
  id: string;
  user_id?: string;
  name: string;
  declared_positions: string[];
  archetype: string;
  avatar_url?: string;
  created_at: string;
}

export interface PlayerStats {
  id: string;
  player_id: string;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  build_image_url?: string;
  ocr_extracted_at?: string;
  updated_at: string;
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

export interface TournamentPlayerStats {
  tournament_id: string;
  player_id: string;
  name: string;
  archetype: string;
  declared_positions: string[];
  community_position: string;
  community_confidence: number;
  total_position_votes: number;
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

// ========================
// SQUAD BUILDER TYPES
// ========================

export interface PitchPositionSlot {
  slotId: string;
  positionCode: string;
  displayName: string;
  xPercent: number; // 0 to 100 on the pitch width
  yPercent: number; // 0 to 100 on the pitch height (0 = GK at bottom, 100 = ATA at top)
  assignedPlayerId?: string | null;
}

export type FormationKey = '4-3-3' | '4-2-3-1' | '3-5-2' | '1-2-1' | '2-2';

export interface FormationPreset {
  key: FormationKey;
  label: string;
  format: '11x11' | '5x5';
  slots: PitchPositionSlot[];
}
