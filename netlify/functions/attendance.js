import { readDB, writeDB } from './lib/db.js';
import { r, validateToken } from './lib/auth-middleware.js';

// Função auxiliar para verificar se já passou de quarta-feira 00:00 da semana configurada
function shouldResetAttendance(lastClearedDateStr) {
  if (!lastClearedDateStr) return true;
  
  const lastCleared = new Date(lastClearedDateStr);
  const now = new Date();
  
  // Encontra a última quarta-feira 00:00 no fuso de Brasília (UTC-3 approx)
  const lastWednesday = new Date();
  
  // Ajusta para o fuso (gambiarra básica para UTC-3)
  lastWednesday.setUTCHours(lastWednesday.getUTCHours() - 3);
  
  // Define a hora para 00:00:00
  lastWednesday.setHours(0, 0, 0, 0);
  
  // Volta os dias até quarta-feira (getDay() == 3)
  while (lastWednesday.getDay() !== 3) {
    lastWednesday.setDate(lastWednesday.getDate() - 1);
  }

  // Volta pro UTC puro para comparar
  lastWednesday.setUTCHours(lastWednesday.getUTCHours() + 3);

  return lastCleared < lastWednesday;
}

export const handler = async (event) => {
  try {
    let attendanceData = await readDB('attendance', { list: {}, lastCleared: null });
    
    // Lazy reset
    if (shouldResetAttendance(attendanceData.lastCleared)) {
      attendanceData = { list: {}, lastCleared: new Date().toISOString() };
      await writeDB('attendance', attendanceData);
    }

    if (event.httpMethod === 'GET') {
      return r(200, attendanceData.list);
    }

    if (event.httpMethod === 'PUT') {
      const auth = await validateToken(event);
      if (!auth.isValid) return r(401, { error: auth.error });

      const body = JSON.parse(event.body || '{}');
      
      // Admins podem alterar a presença de outras pessoas
      if (body.playerId && body.playerId !== auth.playerId) {
        const admins = await readDB('admins', []);
        const players = await readDB('players', []);
        const p = players.find(pl => pl.id === auth.playerId);
        const isSuperAdmin = admins.some(a => a.player_id === auth.playerId) || (p && p.username === 'vito');
        
        if (!isSuperAdmin) {
          return r(403, { error: 'Acesso negado para alterar status de outro jogador.' });
        }
      }

      const targetPlayerId = body.playerId || auth.playerId;
      
      if (!['in', 'out'].includes(body.status)) {
        return r(400, { error: 'Status inválido. Use "in" ou "out".' });
      }

      attendanceData.list[targetPlayerId] = {
        status: body.status,
        updatedAt: new Date().toISOString()
      };

      await writeDB('attendance', attendanceData);
      return r(200, attendanceData.list);
    }

    return r(405, { error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return r(500, { error: err.message || 'Erro interno' });
  }
};
