import { readDB, writeDB } from './lib/db.js';
import { r, validateToken } from './lib/auth-middleware.js';

export const handler = async (event) => {
  try {
    let config = await readDB('weekly_config', { dayOfWeek: 'Terça-feira', time: '19:30' });

    if (event.httpMethod === 'GET') {
      return r(200, config);
    }

    if (event.httpMethod === 'PUT') {
      const auth = await validateToken(event);
      if (!auth.isValid) return r(401, { error: auth.error });

      const [admins, players] = await Promise.all([
        readDB('admins', []),
        readDB('players', [])
      ]);
      const p = players.find(pl => pl.id === auth.playerId);
      const isSuperAdmin = admins.some(a => a.player_id === auth.playerId) || (p && p.username === 'vito');

      if (!isSuperAdmin) {
        return r(403, { error: 'Acesso negado' });
      }

      const body = JSON.parse(event.body || '{}');
      if (body.dayOfWeek) config.dayOfWeek = body.dayOfWeek;
      if (body.time) config.time = body.time;

      await writeDB('weekly_config', config);
      return r(200, config);
    }

    return r(405, { error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return r(500, { error: err.message || 'Erro interno' });
  }
};
