import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Player, PlayerWithStats } from '../lib/types';
import { api } from '../lib/api';

interface AuthContextType {
  player: Player | null;
  playerWithStats: PlayerWithStats | null;
  isAdmin: boolean;
  loading: boolean;
  login: (username: string) => Promise<void>;
  logout: () => void;
  refreshPlayer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [playerWithStats, setPlayerWithStats] = useState<PlayerWithStats | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshPlayer = useCallback(async () => {
    if (!player) return;
    try {
      const [updated, adminCheck] = await Promise.all([
        api.getPlayer(player.id),
        api.checkAdmin(player.id),
      ]);
      setPlayerWithStats(updated);
      setPlayer({
        id: updated.id,
        username: updated.username,
        nickname: updated.nickname,
        has_avatar: updated.has_avatar,
        self_rating: updated.self_rating,
        created_at: updated.created_at,
      });
      setIsAdmin(adminCheck.is_admin);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.id]);

  useEffect(() => {
    const stored = localStorage.getItem('pelada_zs_player');
    if (stored) {
      try {
        const p = JSON.parse(stored) as Player;
        setPlayer(p);
      } catch {
        localStorage.removeItem('pelada_zs_player');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (player?.id) {
      refreshPlayer();
    }
  }, [player?.id, refreshPlayer]);

  const login = async (username: string) => {
    const { player: p, token } = await api.login(username.trim());
    setPlayer(p);
    localStorage.setItem('pelada_zs_player', JSON.stringify(p));
    localStorage.setItem('pelada_zs_token', token);
  };

  const logout = () => {
    setPlayer(null);
    setPlayerWithStats(null);
    setIsAdmin(false);
    localStorage.removeItem('pelada_zs_player');
    localStorage.removeItem('pelada_zs_token');
  };

  return (
    <AuthContext.Provider value={{ player, playerWithStats, isAdmin, loading, login, logout, refreshPlayer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
