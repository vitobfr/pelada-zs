import { readDB, writeDB } from './netlify/functions/lib/db.js';

async function run() {
  const players = await readDB('players', []);
  
  const names = [
    'Ronaldinho', 'Ronaldo', 'Rivaldo', 'Cafu', 'Roberto Carlos',
    'Pelé', 'Zico', 'Romário', 'Bebeto', 'Taffarel',
    'Dida', 'Kaká', 'Adriano', 'Neymar', 'Vini Jr',
    'Rodrygo', 'Casemiro', 'Thiago Silva', 'Marquinhos', 'Alisson',
    'Ederson', 'Richarlison', 'Gabriel Jesus'
  ];

  let added = 0;
  for (const name of names) {
    const username = name.toLowerCase().replace(/[^a-z]/g, '');
    if (!players.some(p => p.username === username)) {
      players.push({
        id: 'bot_' + Math.random().toString(36).substring(2, 9),
        username: username,
        nickname: name,
        has_avatar: false,
        self_rating: Math.floor(Math.random() * 5) + 5, // 5 to 9
        created_at: new Date().toISOString()
      });
      added++;
    }
  }

  if (added > 0) {
    await writeDB('players', players);
    console.log(`Added ${added} players!`);
  } else {
    console.log('Players already exist.');
  }
}
run();
