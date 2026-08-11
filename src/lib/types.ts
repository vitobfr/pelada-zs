export interface Player {
  id: string;
  username: string;
  nickname: string;
  has_avatar: boolean;
  self_rating: number;
  created_at: string;
  manual_goals?: number;
  manual_assists?: number;
  manual_matches?: number;
}

export interface Rating {
  id: string;
  rater_id: string;
  rated_id: string;
  rating: number;
}

export interface MatchTeam {
  name: string;
  player_ids: string[];
}

export interface Game {
  id: string;
  team1: string;
  team2: string;
}

export interface Match {
  id: string;
  date: string;
  description: string;
  created_by: string;
  teams: MatchTeam[];
  schedule?: Game[];
  created_at: string;
}

export interface MatchStat {
  id: string;
  match_id: string;
  game_id?: string;
  player_id: string;
  team: string;
  goals: number;
  assists: number;
}

export interface Admin {
  player_id: string;
}

export interface PlayerWithStats extends Player {
  total_goals: number;
  total_assists: number;
  avg_rating: number;
  matches_played: number;
  is_admin: boolean;
}

export interface RankingEntry {
  player_id: string;
  username: string;
  nickname: string;
  has_avatar: boolean;
  total_goals: number;
  total_assists: number;
  score: number;
  avg_rating: number;
  matches_played: number;
}

export interface AppData {
  players: Player[];
  ratings: Rating[];
  matches: Match[];
  match_stats: MatchStat[];
  admins: Admin[];
}
