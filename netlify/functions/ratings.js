import { readDB, writeDB } from './lib/db.js';
import { r, uid, validateToken } from './lib/auth-middleware.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return r(405, { error: 'Method not allowed' });
  try {
    const auth = await validateToken(event);
    if (!auth.isValid) return r(401, { error: auth.error });

    const body = JSON.parse(event.body || '{}');
    if (!body.raterId || !body.ratedId || !body.rating || body.rating < 1 || body.rating > 5) {
      return r(400, { error: 'Dados inválidos' });
    }
    
    if (body.raterId !== auth.playerId) return r(403, { error: 'Acesso negado' });
    if (body.raterId === body.ratedId) return r(400, { error: 'Não pode avaliar a si mesmo' });

    const ratings = await readDB('ratings', []);
    const idx = ratings.findIndex(rt => rt.rater_id === body.raterId && rt.rated_id === body.ratedId);
    
    if (idx !== -1) {
      ratings[idx].rating = body.rating;
    } else {
      ratings.push({ id: uid(), rater_id: body.raterId, rated_id: body.ratedId, rating: body.rating });
    }
    
    await writeDB('ratings', ratings);
    return r(200, { ok: true });
  } catch (err) {
    console.error(err);
    return r(500, { error: err.message || 'Erro interno' });
  }
};
