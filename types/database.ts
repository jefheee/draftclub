export type Tier = 'S' | 'A' | 'B' | 'C' | 'D' | 'UNRATED';

export interface Player {
  id: string;
  name: string;
  positions: string[];
  is_captain: boolean;
  created_at: string;
}

export interface Evaluation {
  id: string;
  player_id: string;
  mechanic_score: number;
  iq_score: number;
  teamplay_score: number;
  created_at: string;
}

export interface PlayerStats {
  player_id: string;
  name: string;
  positions: string[];
  is_captain: boolean;
  evaluation_count: number;
  avg_mechanic: number;
  avg_iq: number;
  avg_teamplay: number;
  overall_score: number;
  tier: Tier;
}

export interface EvaluationFormData {
  playerId: string;
  mechanic: number;
  iq: number;
  teamplay: number;
}
