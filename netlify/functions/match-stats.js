import { readDB } from './lib/db.js';
import { r } from './lib/auth-middleware.js';

export const handler = async () => {
  try {
    const stats = await readDB('match_stats', []);
    return r(200, stats);
  } catch (err) {
    console.error(err);
    return r(500, { error: err.message || 'Erro interno' });
  }
};
