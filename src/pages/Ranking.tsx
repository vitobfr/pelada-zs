import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Avatar } from '../components/Avatar';
import StarRating from '../components/StarRating';
import { BrutalCard } from '../components/ui/BrutalCard';
import { Spinner } from '../components/ui/Spinner';

type SortKey = 'goals' | 'assists' | 'score' | 'rating' | 'matches';

const tabs: { key: SortKey; label: string; icon: string }[] = [
  { key: 'score', label: 'Geral', icon: '🏆' },
  { key: 'goals', label: 'Gols', icon: '⚽' },
  { key: 'assists', label: 'Assistências', icon: '👟' },
  { key: 'rating', label: 'Nível', icon: '⭐' },
  { key: 'matches', label: 'Partidas', icon: '📅' },
];

export default function Ranking() {
  const [sortBy, setSortBy] = useState<SortKey>('score');

  const { data: entries = [], isLoading: loading } = useQuery({
    queryKey: ['ranking'],
    queryFn: api.getRanking,
  });

  const sorted = useMemo(() => {
    return [...entries].sort((a, b) => {
      switch (sortBy) {
        case 'goals': return b.total_goals - a.total_goals || b.total_assists - a.total_assists;
        case 'assists': return b.total_assists - a.total_assists || b.total_goals - a.total_goals;
        case 'score': return b.score - a.score;
        case 'rating': return b.avg_rating - a.avg_rating;
        case 'matches': return b.matches_played - a.matches_played;
        default: return 0;
      }
    });
  }, [entries, sortBy]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-black text-brutal-black uppercase tracking-tighter bg-brutal-yellow px-4 py-1 border-4 border-brutal-black inline-block shadow-brutal-sm -rotate-1 mb-6">
        <span>🏆</span> Ranking
      </h1>

      <div className="flex gap-2 overflow-x-auto pb-4">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setSortBy(tab.key)}
            className={`px-4 py-3 border-4 border-brutal-black font-black uppercase tracking-widest whitespace-nowrap transition-all duration-150 cursor-pointer flex items-center gap-2 ${
              sortBy === tab.key
                ? 'bg-brutal-green text-brutal-black shadow-brutal-sm translate-x-[-2px] translate-y-[-2px]'
                : 'bg-brutal-white text-brutal-black hover:bg-brutal-yellow hover:-translate-y-1 hover:shadow-brutal-sm active:translate-y-1 active:translate-x-1 active:shadow-none'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <BrutalCard className="p-12 text-center">
          <div className="text-6xl mb-6">🏟️</div>
          <p className="text-brutal-black text-2xl font-black uppercase tracking-widest">Nenhum dado de ranking.</p>
        </BrutalCard>
      ) : (
        <BrutalCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-4 border-brutal-black bg-brutal-black">
                  <th className="text-left p-4 text-sm font-black text-brutal-white uppercase tracking-widest w-16">#</th>
                  <th className="text-left p-4 text-sm font-black text-brutal-white uppercase tracking-widest">Jogador</th>
                  <th className="text-center p-4 text-sm font-black text-brutal-white uppercase tracking-widest">Gols</th>
                  <th className="text-center p-4 text-sm font-black text-brutal-white uppercase tracking-widest">Ast</th>
                  <th className="text-center p-4 text-sm font-black text-brutal-white uppercase tracking-widest hidden sm:table-cell">Nível</th>
                  <th className="text-center p-4 text-sm font-black text-brutal-white uppercase tracking-widest hidden md:table-cell">Jogos</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((entry, index) => (
                  <tr key={entry.player_id} className={`border-b-4 border-brutal-black transition-colors hover:bg-brutal-bg ${index % 2 === 0 ? 'bg-brutal-white' : 'bg-brutal-white/50'}`}>
                    <td className="p-4 border-r-4 border-brutal-black">
                      {index < 3 ? (
                        <div className={`w-12 h-12 flex items-center justify-center border-4 border-brutal-black font-black text-xl shadow-brutal-sm ${
                          index === 0 ? 'bg-brutal-yellow text-brutal-black -rotate-6 scale-110' :
                          index === 1 ? 'bg-gray-300 text-brutal-black -rotate-3 scale-105' :
                          'bg-amber-700 text-white rotate-3'
                        }`}>
                          {index + 1}
                        </div>
                      ) : (
                        <span className="text-xl text-brutal-black font-black pl-2">{index + 1}</span>
                      )}
                    </td>
                    <td className="p-4 border-r-4 border-brutal-black">
                      <Link to={`/perfil/${entry.player_id}`} className="flex items-center gap-3 no-underline group active:translate-y-1 transition-transform">
                        {entry.has_avatar ? (
                          <Avatar id={entry.player_id} className="w-12 h-12 object-cover border-2 border-brutal-black shadow-brutal-sm group-hover:border-brutal-green" />
                        ) : (
                          <div className="w-12 h-12 bg-brutal-green flex items-center justify-center text-brutal-black text-lg font-black border-2 border-brutal-black shadow-brutal-sm group-hover:bg-brutal-yellow">
                            {(entry.nickname || entry.username)[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="text-lg font-black text-brutal-black uppercase group-hover:text-brutal-blue transition-colors">
                            {entry.nickname || entry.username}
                          </span>
                          <p className="text-xs font-bold text-brutal-black/70 uppercase tracking-widest">@{entry.username}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="p-4 text-center border-r-4 border-brutal-black">
                      <span className="text-brutal-black font-black text-2xl">{entry.total_goals}</span>
                    </td>
                    <td className="p-4 text-center border-r-4 border-brutal-black">
                      <span className="text-brutal-black font-black text-2xl">{entry.total_assists}</span>
                    </td>
                    <td className="p-4 text-center hidden sm:table-cell border-r-4 border-brutal-black">
                      <div className="bg-brutal-black p-1 inline-block">
                        <StarRating value={Math.round(entry.avg_rating)} readonly size="sm" />
                      </div>
                    </td>
                    <td className="p-4 text-center text-brutal-black text-xl font-black hidden md:table-cell">
                      {entry.matches_played}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BrutalCard>
      )}
    </div>
  );
}
