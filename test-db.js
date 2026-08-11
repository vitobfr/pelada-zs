import { readDB, writeDB } from './netlify/functions/lib/db.js';

async function run() {
  let admins = await readDB('admins', []);
  if (!admins.some(a => a.player_id === 'msoy792ttpd4ms')) {
    admins.push({ player_id: 'msoy792ttpd4ms' });
    await writeDB('admins', admins);
    console.log('Vito promoted to admin!');
  } else {
    console.log('Already admin.');
  }
}
run();
