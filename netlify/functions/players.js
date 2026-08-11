import { readDB, writeDB } from './lib/db.js';
import { r, validateToken } from './lib/auth-middleware.js';

export const handler = async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const [players, ratings, admins, stats] = await Promise.all([
        readDB('players', []),
        readDB('ratings', []),
        readDB('admins', []),
        readDB('match_stats', [])
      ]);

      const url = new URL(event.rawUrl);
      const id = url.searchParams.get('id');

      const enriched = players
        .filter(p => p.username !== 'admin.admin')
        .map(p => {
        const pr = ratings.filter(r => r.rated_id === p.id);
        const avg = pr.length ? pr.reduce((s, r) => s + r.rating, 0) / pr.length : p.self_rating;
        const ps = stats.filter(s => s.player_id === p.id);
        
        return {
          id: p.id, 
          username: p.username, 
          nickname: p.nickname,
          has_avatar: p.has_avatar || false, 
          self_rating: p.self_rating,
          created_at: p.created_at,
          total_goals: ps.reduce((s, st) => s + st.goals, 0) + (p.manual_goals || 0),
          total_assists: ps.reduce((s, st) => s + st.assists, 0) + (p.manual_assists || 0),
          avg_rating: avg,
          matches_played: [...new Set(ps.map(s => s.match_id))].length + (p.manual_matches || 0),
          is_admin: admins.some(a => a.player_id === p.id) || p.username === 'vito',
          manual_goals: p.manual_goals || 0,
          manual_assists: p.manual_assists || 0,
          manual_matches: p.manual_matches || 0,
          is_mensalista: p.is_mensalista || false,
          is_goleiro: p.is_goleiro || false,
        };
      });

      if (id) {
        const found = enriched.find(p => p.id === id);
        return found ? r(200, found) : r(404, { error: 'Jogador não encontrado' });
      }
      return r(200, enriched);
    }

    if (event.httpMethod === 'PUT') {
      const auth = await validateToken(event);
      if (!auth.isValid) return r(401, { error: auth.error });

      const [players, admins] = await Promise.all([
        readDB('players', []),
        readDB('admins', [])
      ]);
      
      const body = JSON.parse(event.body || '{}');
      
      const p = players.find(pl => pl.id === auth.playerId);
      const isSuperAdmin = admins.some(a => a.player_id === auth.playerId) || (p && p.username === 'vito');

      if (body.playerId !== auth.playerId) {
        if (!isSuperAdmin) return r(403, { error: 'Acesso negado' });
      }

      const idx = players.findIndex(pl => pl.id === body.playerId);
      if (idx === -1) return r(404, { error: 'Jogador não encontrado' });

      if (body.nickname !== undefined) players[idx].nickname = body.nickname;
      if (body.self_rating !== undefined) players[idx].self_rating = body.self_rating;
      if (body.has_avatar !== undefined) players[idx].has_avatar = body.has_avatar;

      if (isSuperAdmin) {
        if (body.manual_goals !== undefined) players[idx].manual_goals = body.manual_goals;
        if (body.manual_assists !== undefined) players[idx].manual_assists = body.manual_assists;
        if (body.manual_matches !== undefined) players[idx].manual_matches = body.manual_matches;
        if (body.is_mensalista !== undefined) players[idx].is_mensalista = body.is_mensalista;
        if (body.is_goleiro !== undefined) players[idx].is_goleiro = body.is_goleiro;
      }

      await writeDB('players', players);
      
      const { password, ...updatedPlayer } = players[idx];
      return r(200, updatedPlayer);
    }

    if (event.httpMethod === 'DELETE') {
      const auth = await validateToken(event);
      if (!auth.isValid) return r(401, { error: auth.error });

      const [admins, players] = await Promise.all([
        readDB('admins', []),
        readDB('players', [])
      ]);
      const p = players.find(pl => pl.id === auth.playerId);
      const isSuperAdmin = admins.some(a => a.player_id === auth.playerId) || (p && p.username === 'vito');
      
      if (!isSuperAdmin) return r(403, { error: 'Acesso negado' });

      const body = JSON.parse(event.body || '{}');
      if (!body.playerId) return r(400, { error: 'playerId obrigatório' });

      const newPlayers = players.filter(pl => pl.id !== body.playerId);
      await writeDB('players', newPlayers);
      
      // We could also delete their stats and ratings, but it's optional for now.
      return r(200, { ok: true });
    }

    return r(405, { error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return r(500, { error: err.message || 'Erro interno' });
  }
};
