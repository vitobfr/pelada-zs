import { readDB } from './lib/db.js';
import { r } from './lib/auth-middleware.js';

export const handler = async () => {
  try {
    const [players, ratings, stats] = await Promise.all([
      readDB('players', []),
      readDB('ratings', []),
      readDB('match_stats', [])
    ]);
    
    const ranking = players
      .filter(p => p.username !== 'admin.admin')
      .map(p => {
      const pr = ratings.filter(rt => rt.rated_id === p.id);
      const avg = pr.length ? pr.reduce((s, rt) => s + rt.rating, 0) / pr.length : p.self_rating;
      const ps = stats.filter(s => s.player_id === p.id);
      
      return {
        player_id: p.id, 
        username: p.username, 
        nickname: p.nickname, 
        has_avatar: p.has_avatar || false,
        total_goals: ps.reduce((s, st) => s + st.goals, 0),
        total_assists: ps.reduce((s, st) => s + st.assists, 0),
        score: ps.reduce((s, st) => s + st.goals, 0) * 3 + ps.reduce((s, st) => s + st.assists, 0) * 2,
        avg_rating: avg,
        matches_played: [...new Set(ps.map(s => s.match_id))].length,
      };
    });
    
    ranking.sort((a, b) => b.score - a.score);
    return r(200, ranking);
  } catch (err) {
    console.error(err);
    return r(500, { error: err.message || 'Erro interno' });
  }
};
