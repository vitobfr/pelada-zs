import { readDB } from './lib/db.js';
import { r } from './lib/auth-middleware.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return r(405, { error: 'Method not allowed' });
  try {
    const body = JSON.parse(event.body || '{}');
    if (!body.playerIds || !Array.isArray(body.playerIds) || body.playerIds.length < 4) {
      return r(400, { error: 'Precisa de pelo menos 4 jogadores' });
    }

    const [players, ratings] = await Promise.all([
      readDB('players', []),
      readDB('ratings', [])
    ]);

    const selected = players
      .filter(p => body.playerIds.includes(p.id))
      .map(p => {
        const pr = ratings.filter(r_1 => r_1.rated_id === p.id);
        const avg_rating = pr.length ? pr.reduce((s, r_2) => s + r_2.rating, 0) / pr.length : p.self_rating;
        return { ...p, avg_rating };
      })
      .sort((a, b) => b.avg_rating - a.avg_rating);

    const teams = [
      { name: 'A', player_ids: [] }, { name: 'B', player_ids: [] },
      { name: 'C', player_ids: [] }, { name: 'D', player_ids: [] },
    ];
    
    selected.forEach((player, i) => {
      const round = Math.floor(i / 4);
      const pos = i % 4;
      const idx = round % 2 === 0 ? pos : 3 - pos;
      teams[idx].player_ids.push(player.id);
    });

    return r(200, { teams });
  } catch (err) {
    return r(500, { error: err.message || 'Erro interno' });
  }
};
