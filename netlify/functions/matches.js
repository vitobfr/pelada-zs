import { readDB, writeDB } from './lib/db.js';
import { r, uid, validateToken } from './lib/auth-middleware.js';

export const handler = async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const matches = await readDB('matches', []);
      matches.sort((a, b) => new Date(b.date) - new Date(a.date));
      return r(200, matches);
    }

    if (event.httpMethod === 'POST') {
      const auth = await validateToken(event);
      if (!auth.isValid) return r(401, { error: auth.error });

      const body = JSON.parse(event.body || '{}');
      if (!body.adminId || !body.teams || !Array.isArray(body.teams) || body.teams.length !== 4) {
        return r(400, { error: 'Dados inválidos. Precisa de 4 times.' });
      }

      if (body.adminId !== auth.playerId) return r(403, { error: 'Acesso negado' });

      const [admins, matches] = await Promise.all([
        readDB('admins', []),
        readDB('matches', [])
      ]);
      
      if (!admins.some(a => a.player_id === body.adminId)) {
        return r(403, { error: 'Apenas admins' });
      }

      const match = { 
        id: uid(), 
        date: new Date().toISOString(), 
        description: body.description || '', 
        created_by: body.adminId, 
        teams: body.teams, 
        schedule: body.schedule || [],
        created_at: new Date().toISOString() 
      };
      
      matches.push(match);
      await writeDB('matches', matches);
      
      return r(200, match);
    }

    if (event.httpMethod === 'PUT') {
      const auth = await validateToken(event);
      if (!auth.isValid) return r(401, { error: auth.error });
      
      const [admins, existing] = await Promise.all([
        readDB('admins', []),
        readDB('match_stats', [])
      ]);
      
      if (!admins.some(a => a.player_id === auth.playerId)) {
        return r(403, { error: 'Apenas admins' });
      }

      const body = JSON.parse(event.body || '{}');
      if (!body.matchId || !body.stats || !Array.isArray(body.stats)) {
        return r(400, { error: 'Dados inválidos' });
      }
      
      const filtered = existing.filter(s => s.match_id !== body.matchId);
      const add = body.stats.map(s => ({ 
        id: uid(), 
        match_id: s.match_id, 
        player_id: s.player_id, 
        team: s.team,
        game_id: s.game_id,
        goals: s.goals || 0, 
        assists: s.assists || 0 
      }));
      
      await writeDB('match_stats', [...filtered, ...add]);
      return r(200, { ok: true });
    }

    if (event.httpMethod === 'DELETE') {
      const auth = await validateToken(event);
      if (!auth.isValid) return r(401, { error: auth.error });
      
      const body = JSON.parse(event.body || '{}');
      if (!body.matchId) return r(400, { error: 'matchId obrigatório' });

      const [admins, matches, match_stats] = await Promise.all([
        readDB('admins', []),
        readDB('matches', []),
        readDB('match_stats', [])
      ]);
      
      const isSuperAdmin = admins.some(a => a.player_id === auth.playerId) || auth.username === 'vito';
      if (!isSuperAdmin) return r(403, { error: 'Acesso negado' });

      const newMatches = matches.filter(m => m.id !== body.matchId);
      const newStats = match_stats.filter(s => s.match_id !== body.matchId);

      await Promise.all([
        writeDB('matches', newMatches),
        writeDB('match_stats', newStats)
      ]);

      return r(200, { ok: true });
    }

    return r(405, { error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return r(500, { error: err.message || 'Erro interno' });
  }
};
