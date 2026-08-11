const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('pelada_zs_token');
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(err.error || `Erro ${res.status}`);
  }
  
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('text/plain')) {
    return (await res.text()) as T;
  }
  return (await res.json()) as T;
}

let avatarsPromise: Promise<Record<string, string>> | null = null;

export const api = {
  login: (username: string) =>
    request<{ player: import('./types').Player; token: string }>('/auth', {
      method: 'POST',
      body: JSON.stringify({ username }),
    }),

  getPlayers: () =>
    request<import('./types').PlayerWithStats[]>('/players'),

  getPlayer: (id: string) =>
    request<import('./types').PlayerWithStats>(`/players?id=${id}`),

  updatePlayer: (playerId: string, data: { nickname?: string; self_rating?: number; manual_goals?: number; manual_assists?: number; manual_matches?: number; is_mensalista?: boolean; is_goleiro?: boolean; }) =>
    request<import('./types').Player>('/players', {
      method: 'PUT',
      body: JSON.stringify({ playerId, ...data }),
    }),

  deletePlayer: (playerId: string) =>
    request<{ ok: boolean }>('/players', {
      method: 'DELETE',
      body: JSON.stringify({ playerId }),
    }),

  addAdmin: (playerId: string) =>
    request<{ ok: boolean }>('/admin', {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    }),

  removeAdmin: (playerId: string) =>
    request<{ ok: boolean }>('/admin', {
      method: 'DELETE',
      body: JSON.stringify({ playerId }),
    }),

  updateAvatar: (avatar_base64: string) =>
    request<{ ok: boolean }>('/avatar', {
      method: 'POST',
      body: JSON.stringify({ avatar_base64 }),
    }).then(() => { avatarsPromise = null; }),

  getAvatar: async (id: string) => {
    if (!avatarsPromise) {
      avatarsPromise = request<Record<string, string>>('/avatar').catch(() => ({}));
    }
    const avatars = await avatarsPromise;
    return avatars?.[id] || null;
  },

  getAvatarUrl: (id: string) => `${API_BASE}/avatar?id=${id}`,

  ratePlayer: (raterId: string, ratedId: string, rating: number) =>
    request<{ ok: boolean }>('/ratings', {
      method: 'POST',
      body: JSON.stringify({ raterId, ratedId, rating }),
    }),

  getMatches: () =>
    request<import('./types').Match[]>('/matches'),

  createMatch: (adminId: string, teams: import('./types').MatchTeam[], description: string, schedule?: import('./types').Game[]) =>
    request<import('./types').Match>('/matches', {
      method: 'POST',
      body: JSON.stringify({ adminId, teams, description, schedule }),
    }),

  deleteMatch: (matchId: string) =>
    request<{ ok: boolean }>('/matches', {
      method: 'DELETE',
      body: JSON.stringify({ matchId }),
    }),

  updateMatchStats: (matchId: string, stats: Omit<import('./types').MatchStat, 'id'>[]) =>
    request<{ ok: boolean }>('/matches', {
      method: 'PUT',
      body: JSON.stringify({ matchId, stats }),
    }),

  getRanking: () =>
    request<import('./types').RankingEntry[]>('/ranking'),

  checkAdmin: (playerId: string) =>
    request<{ is_admin: boolean }>(`/admin?playerId=${playerId}`),

  drawTeams: (playerIds: string[]) =>
    request<{ teams: import('./types').MatchTeam[] }>('/draw', {
      method: 'POST',
      body: JSON.stringify({ playerIds }),
    }),

  getAttendance: () =>
    request<Record<string, { status: 'in' | 'out', updatedAt: string }>>('/attendance'),

  setAttendance: (status: 'in' | 'out', playerId?: string) =>
    request<Record<string, { status: 'in' | 'out', updatedAt: string }>>('/attendance', {
      method: 'PUT',
      body: JSON.stringify({ status, playerId }),
    }),

  getWeeklyConfig: () =>
    request<{ dayOfWeek: string; time: string }>('/weekly-config'),

  updateWeeklyConfig: (dayOfWeek: string, time: string) =>
    request<{ dayOfWeek: string; time: string }>('/weekly-config', {
      method: 'PUT',
      body: JSON.stringify({ dayOfWeek, time }),
    }),
};
