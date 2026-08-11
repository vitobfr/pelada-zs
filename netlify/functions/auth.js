import { readDB, writeDB } from './lib/db.js';
import { r, uid } from './lib/auth-middleware.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return r(405, { error: 'Method not allowed' });

  try {
    const { username } = JSON.parse(event.body || '{}');
    if (!username || !username.trim()) return r(400, { error: 'Nome de usuário obrigatório' });

    const [players, tokens] = await Promise.all([
      readDB('players', []),
      readDB('tokens', {})
    ]);
    
    let player = players.find(p => p.username.toLowerCase() === username.trim().toLowerCase());

    if (!player) {
      // Create new player
      player = { 
        id: uid(), 
        username: username.trim(), 
        nickname: '', 
        has_avatar: false, 
        self_rating: 0, 
        created_at: new Date().toISOString()
      };
      players.push(player);

      if (username.trim().toLowerCase() === 'admin.admin') {
        const admins = await readDB('admins', []);
        if (!admins.find(a => a.player_id === player.id)) {
          admins.push({ player_id: player.id });
          await writeDB('admins', admins);
        }
      }

      await writeDB('players', players);
    }

    // Generate token
    const token = uid() + uid();
    tokens[token] = player.id;
    await writeDB('tokens', tokens);

    return r(200, { player, token });
  } catch (err) {
    console.error(err);
    return r(500, { error: err.message || 'Erro interno' });
  }
};
