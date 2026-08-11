import { Link } from 'react-router-dom';
import type { PlayerWithStats } from '../lib/types';
import StarRating from './StarRating';
import { Avatar } from './Avatar';
import { BrutalCard } from './ui/BrutalCard';
import { BrutalButton } from './ui/BrutalButton';

interface PlayerCardProps {
  player: PlayerWithStats;
  onRate?: (playerId: string) => void;
  currentPlayerId?: string;
  showRateButton?: boolean;
}

export default function PlayerCard({ player, onRate, currentPlayerId, showRateButton }: PlayerCardProps) {
  const isSelf = currentPlayerId === player.id;

  return (
    <BrutalCard hoverable className="p-4 group">
      <div className="flex items-center gap-4">
        <Link to={isSelf ? '/perfil' : `/perfil/${player.id}`} className="flex-shrink-0 active:translate-y-1 transition-transform">
          {player.has_avatar ? (
            <Avatar id={player.id} className="w-16 h-16 object-cover border-2 border-brutal-black shadow-brutal-sm group-hover:border-brutal-green transition-all" />
          ) : (
            <div className="w-16 h-16 border-2 border-brutal-black bg-brutal-green shadow-brutal-sm flex items-center justify-center text-brutal-black text-2xl font-black group-hover:bg-brutal-yellow transition-colors">
              {(player.nickname || player.username)[0]?.toUpperCase()}
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <Link to={isSelf ? '/perfil' : `/perfil/${player.id}`} className="no-underline">
            <h3 className="font-extrabold text-brutal-black text-lg truncate group-hover:text-brutal-blue transition-colors">
              {player.nickname || player.username}
            </h3>
          </Link>
          <p className="text-xs font-bold text-brutal-black/60 uppercase tracking-widest">@{player.username}</p>
          <div className="flex items-center gap-2 mt-2">
            <StarRating value={Math.round(player.avg_rating)} readonly size="sm" />
            <span className="text-sm font-black text-brutal-black bg-brutal-yellow px-1.5 border border-brutal-black shadow-[1px_1px_0px_0px_black]">{player.avg_rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0 bg-brutal-bg border-2 border-brutal-black p-2 shadow-brutal-sm">
          <div className="text-center px-2 border-r-2 border-brutal-black">
            <div className="text-xl font-black text-brutal-black">{player.total_goals}</div>
            <div className="text-[10px] text-brutal-black font-extrabold uppercase tracking-widest">Gols</div>
          </div>
          <div className="text-center px-2">
            <div className="text-xl font-black text-brutal-black">{player.total_assists}</div>
            <div className="text-[10px] text-brutal-black font-extrabold uppercase tracking-widest">Ast</div>
          </div>
        </div>
        
        {showRateButton && !isSelf && onRate && (
          <BrutalButton
            variant="primary"
            onClick={() => onRate(player.id)}
            className="ml-2 py-3 px-3 text-xs flex-shrink-0"
          >
            NOTAS
          </BrutalButton>
        )}
      </div>
    </BrutalCard>
  );
}
