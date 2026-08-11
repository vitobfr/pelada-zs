import { readDB, writeDB } from './lib/db.js';
import { r, validateToken } from './lib/auth-middleware.js';

export const handler = async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const avatars = await readDB('avatars', {});
      return r(200, avatars);
    }

    if (event.httpMethod === 'POST') {
      const auth = await validateToken(event);
      if (!auth.isValid) return r(401, { error: auth.error });

      const body = JSON.parse(event.body || '{}');
      if (!body.avatar_base64) return r(400, { error: 'avatar_base64 obrigatório' });

      const avatars = await readDB('avatars', {});
      avatars[auth.playerId] = body.avatar_base64;
      await writeDB('avatars', avatars);

      // Update player flag
      const players = await readDB('players', []);
      const p = players.find(x => x.id === auth.playerId);
      if (p) {
        p.has_avatar = true;
        await writeDB('players', players);
      }

      return r(200, { ok: true });
    }

    return r(405, { error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return r(500, { error: err.message || 'Erro interno' });
  }
};
