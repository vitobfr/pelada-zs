import { readDB, writeDB } from './lib/db.js';
import { r, validateToken } from './lib/auth-middleware.js';

export const handler = async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const url = new URL(event.rawUrl);
      const playerId = url.searchParams.get('playerId');
      if (!playerId) return r(400, { error: 'playerId obrigatório' });
      
      const [admins, players] = await Promise.all([
        readDB('admins', []),
        readDB('players', [])
      ]);
      const p = players.find(pl => pl.id === playerId);
      const is_admin = admins.some(a => a.player_id === playerId) || (p && p.username === 'vito');
      
      return r(200, { is_admin });
    }

    if (event.httpMethod === 'POST' || event.httpMethod === 'DELETE') {
      const auth = await validateToken(event);
      if (!auth.isValid) return r(401, { error: auth.error });

      const [admins, players] = await Promise.all([
        readDB('admins', []),
        readDB('players', [])
      ]);
      const p = players.find(pl => pl.id === auth.playerId);
      const is_admin = admins.some(a => a.player_id === auth.playerId) || (p && p.username === 'vito');

      if (!is_admin) return r(403, { error: 'Acesso negado' });

      const body = JSON.parse(event.body || '{}');
      const targetId = body.playerId;
      if (!targetId) return r(400, { error: 'playerId do alvo obrigatório' });

      if (event.httpMethod === 'POST') {
        if (!admins.some(a => a.player_id === targetId)) {
          admins.push({ player_id: targetId });
          await writeDB('admins', admins);
        }
        return r(200, { ok: true });
      }

      if (event.httpMethod === 'DELETE') {
        const newAdmins = admins.filter(a => a.player_id !== targetId);
        await writeDB('admins', newAdmins);
        return r(200, { ok: true });
      }
    }

    return r(405, { error: 'Method not allowed' });
  } catch (err) {
    return r(500, { error: err.message || 'Erro interno' });
  }
};
