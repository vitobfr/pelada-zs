import { readDB } from './db.js';

export async function validateToken(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isValid: false, error: 'Token não fornecido' };
  }

  const token = authHeader.split(' ')[1];
  const tokens = await readDB('tokens', {});

  const playerId = tokens[token];
  if (!playerId) {
    return { isValid: false, error: 'Token inválido ou expirado' };
  }

  return { isValid: true, playerId };
}

export function r(code, body) {
  return {
    statusCode: code,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
