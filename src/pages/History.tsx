import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Match, MatchStat } from '../lib/types';
import { BrutalCard } from '../components/ui/BrutalCard';
import { BrutalButton } from '../components/ui/BrutalButton';
import { Spinner } from '../components/ui/Spinner';

const teamStyles: Record<string, { bg: string, text: string, border: string }> = {
  'Time A': { bg: 'bg-brutal-red', text: 'text-white', border: 'border-brutal-black' },
  'Time B': { bg: 'bg-brutal-blue', text: 'text-white', border: 'border-brutal-black' },
  'Time C': { bg: 'bg-brutal-yellow', text: 'text-brutal-black', border: 'border-brutal-black' },
  'Time D': { bg: 'bg-brutal-green', text: 'text-brutal-black', border: 'border-brutal-black' },
};

export default function History() {
  const queryClient = useQueryClient();

  const { data: matches = [], isLoading: loadingMatches } = useQuery({
    queryKey: ['matches'],
    queryFn: api.getMatches,
  });

  const { data: players = [], isLoading: loadingPlayers } = useQuery({
    queryKey: ['players'],
    queryFn: api.getPlayers,
  });

  const { data: stats = [], isLoading: loadingStats } = useQuery({
    queryKey: ['match-stats'],
    queryFn: async () => {
      const res = await fetch('/api/match-stats');
      return res.json() as Promise<MatchStat[]>;
    }
  });

  const loading = loadingMatches || loadingPlayers || loadingStats;

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editStats, setEditStats] = useState<Record<string, { goals: number; assists: number }>>({});

  const getPlayerName = (id: string) => {
    const p = players.find(pl => pl.id === id);
    return p?.nickname || p?.username || id.slice(0, 6);
  };

  const handleEdit = (match: Match) => {
    const newEditStats: Record<string, { goals: number; assists: number }> = {};
    if (match.schedule && match.schedule.length > 0) {
      match.schedule.forEach(game => {
        match.teams.forEach(team => {
          if (team.name === game.team1 || `Time ${team.name}` === game.team1 || team.name === `Time ${game.team1}` ||
              team.name === game.team2 || `Time ${team.name}` === game.team2 || team.name === `Time ${game.team2}`) {
            team.player_ids.forEach(pid => {
              const stat = stats.find(s => s.match_id === match.id && s.game_id === game.id && s.player_id === pid);
              newEditStats[`${game.id}_${pid}`] = { goals: stat?.goals || 0, assists: stat?.assists || 0 };
            });
          }
        });
      });
    } else {
      match.teams.forEach(team => {
        team.player_ids.forEach(pid => {
          const stat = stats.find(s => s.match_id === match.id && s.player_id === pid);
          newEditStats[`all_${pid}`] = { goals: stat?.goals || 0, assists: stat?.assists || 0 };
        });
      });
    }
    setEditStats(newEditStats);
    setEditingMatchId(match.id);
  };

  const updateStatsMutation = useMutation({
    mutationFn: (vars: { matchId: string; statEntries: Omit<MatchStat, 'id'>[] }) =>
      api.updateMatchStats(vars.matchId, vars.statEntries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['match-stats'] });
      setEditingMatchId(null);
    },
    onError: () => {
      alert('Erro ao salvar estatísticas.');
    }
  });

  const handleSaveStats = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const statEntries: Omit<MatchStat, 'id'>[] = [];
    if (match.schedule && match.schedule.length > 0) {
      match.schedule.forEach(game => {
        match.teams.forEach(team => {
          if (team.name === game.team1 || `Time ${team.name}` === game.team1 || team.name === `Time ${game.team1}` ||
              team.name === game.team2 || `Time ${team.name}` === game.team2 || team.name === `Time ${game.team2}`) {
            team.player_ids.forEach(pid => {
              const e = editStats[`${game.id}_${pid}`];
              if (e && (e.goals > 0 || e.assists > 0)) {
                statEntries.push({
                  match_id: matchId, player_id: pid, team: team.name, game_id: game.id,
                  goals: e.goals, assists: e.assists,
                });
              }
            });
          }
        });
      });
    } else {
      match.teams.forEach(team => {
        team.player_ids.forEach(pid => {
          const e = editStats[`all_${pid}`];
          if (e && (e.goals > 0 || e.assists > 0)) {
            statEntries.push({
              match_id: matchId, player_id: pid, team: team.name,
              goals: e.goals, assists: e.assists,
            });
          }
        });
      });
    }

    updateStatsMutation.mutate({ matchId, statEntries });
  };

  const getLeaderboard = (match: Match) => {
    if (!match.schedule) return [];
    
    const table: Record<string, { points: number, wins: number, draws: number, losses: number, gf: number, ga: number }> = {};
    match.teams.forEach(t => {
      const normalizedName = t.name.startsWith('Time ') ? t.name : `Time ${t.name}`;
      table[normalizedName] = { points: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 };
    });

    match.schedule.forEach(game => {
      let g1 = 0; let g2 = 0;
      stats.filter(s => s.match_id === match.id && s.game_id === game.id).forEach(s => {
        if (s.team === game.team1) g1 += s.goals;
        if (s.team === game.team2) g2 += s.goals;
      });
      
      const team1Norm = game.team1.startsWith('Time ') ? game.team1 : `Time ${game.team1}`;
      const team2Norm = game.team2.startsWith('Time ') ? game.team2 : `Time ${game.team2}`;
      
      const t1 = table[team1Norm];
      const t2 = table[team2Norm];
      if (t1 && t2) {
        t1.gf += g1; t1.ga += g2;
        t2.gf += g2; t2.ga += g1;
        if (g1 > g2) { t1.points += 3; t1.wins++; t2.losses++; }
        else if (g2 > g1) { t2.points += 3; t2.wins++; t1.losses++; }
        else { t1.points += 1; t2.points += 1; t1.draws++; t2.draws++; }
      }
    });

    return Object.entries(table).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga));
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-black text-brutal-black uppercase tracking-tighter bg-brutal-yellow px-4 py-1 border-4 border-brutal-black inline-block shadow-brutal-sm -rotate-1 mb-6">
        <span>📋</span> Histórico de Partidas
      </h1>

      {matches.length === 0 ? (
        <BrutalCard className="p-12 text-center">
          <div className="text-6xl mb-6">⚽</div>
          <p className="text-brutal-black text-2xl font-black uppercase tracking-widest">Nenhuma partida registrada.</p>
        </BrutalCard>
      ) : (
        <div className="space-y-6">
          {matches.map(match => {
            const leaderboard = getLeaderboard(match);
            const hasSchedule = match.schedule && match.schedule.length > 0;

            return (
              <BrutalCard key={match.id} hoverable className="p-0">
                <button
                  onClick={() => setExpandedId(expandedId === match.id ? null : match.id)}
                  className="w-full p-6 flex items-center justify-between bg-transparent border-none cursor-pointer text-left hover:bg-brutal-bg transition-colors"
                >
                  <div>
                    <span className="font-black text-brutal-black text-2xl uppercase tracking-widest">
                      {new Date(match.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    {match.description && (
                      <p className="text-lg font-bold text-brutal-black/70 mt-2 uppercase tracking-widest">{match.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-black text-brutal-white bg-brutal-black px-3 py-1 uppercase tracking-widest border-2 border-brutal-black">
                      {match.teams.reduce((acc, t) => acc + t.player_ids.length, 0)} JOG
                    </span>
                    <svg className={`w-8 h-8 text-brutal-black transition-transform ${expandedId === match.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {expandedId === match.id && (
                  <div className="p-6 border-t-4 border-brutal-black bg-brutal-bg">
                    
                    {/* Classificação do Dia */}
                    {hasSchedule && (
                      <div className="mb-8">
                        <h3 className="font-display text-xl font-black text-brutal-black mb-4 uppercase tracking-widest">🏆 Classificação do Dia</h3>
                        <div className="bg-brutal-white border-4 border-brutal-black overflow-hidden">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-brutal-black text-brutal-white font-black uppercase text-sm">
                                <th className="p-3 border-r-2 border-brutal-black">Pos</th>
                                <th className="p-3 border-r-2 border-brutal-black">Time</th>
                                <th className="p-3 border-r-2 border-brutal-black text-center">Pts</th>
                                <th className="p-3 border-r-2 border-brutal-black text-center">V</th>
                                <th className="p-3 border-r-2 border-brutal-black text-center">E</th>
                                <th className="p-3 border-r-2 border-brutal-black text-center">D</th>
                                <th className="p-3 text-center">SG</th>
                              </tr>
                            </thead>
                            <tbody>
                              {leaderboard.map((team, idx) => (
                                <tr key={team.name} className="border-t-2 border-brutal-black font-bold uppercase text-sm">
                                  <td className="p-3 border-r-2 border-brutal-black text-center bg-brutal-bg">{idx + 1}º</td>
                                  <td className="p-3 border-r-2 border-brutal-black flex items-center gap-2">
                                    <span className={`w-3 h-3 block border-2 border-brutal-black ${teamStyles[team.name]?.bg || 'bg-white'}`}></span>
                                    {team.name}
                                  </td>
                                  <td className="p-3 border-r-2 border-brutal-black text-center font-black">{team.points}</td>
                                  <td className="p-3 border-r-2 border-brutal-black text-center">{team.wins}</td>
                                  <td className="p-3 border-r-2 border-brutal-black text-center">{team.draws}</td>
                                  <td className="p-3 border-r-2 border-brutal-black text-center">{team.losses}</td>
                                  <td className="p-3 text-center">{team.gf - team.ga}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Editor de Partidas */}
                    {editingMatchId === match.id ? (
                      <div>
                        {hasSchedule ? (
                          <div className="space-y-6">
                            {match.schedule!.map((game, i) => (
                              <div key={game.id} className="bg-brutal-white border-4 border-brutal-black shadow-[4px_4px_0_0_black] p-4">
                                <h4 className="font-display font-black text-xl mb-4 text-center uppercase border-b-2 border-brutal-black pb-2">
                                  Jogo {i + 1}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {[game.team1, game.team2].map(teamName => {
                                    const team = match.teams.find(t => t.name === teamName || `Time ${t.name}` === teamName || t.name === `Time ${teamName}`);
                                    if (!team) return null;
                                    const normalizedName = team.name.startsWith('Time ') ? team.name : `Time ${team.name}`;
                                    const style = teamStyles[normalizedName] || teamStyles['Time A'];
                                    return (
                                      <div key={team.name} className={`${style.bg} border-4 ${style.border} p-3`}>
                                        <h5 className={`font-black text-lg mb-3 text-center ${style.text}`}>{normalizedName}</h5>
                                        <div className="space-y-2">
                                          {team.player_ids.map(pid => (
                                            <div key={pid} className="flex items-center justify-between bg-brutal-white border-2 border-brutal-black p-2">
                                              <span className="text-xs font-black text-brutal-black truncate flex-1">{getPlayerName(pid)}</span>
                                              <div className="flex items-center gap-1">
                                                <input
                                                  type="number" min="0"
                                                  value={editStats[`${game.id}_${pid}`]?.goals ?? 0}
                                                  onChange={(e) => setEditStats(prev => ({ ...prev, [`${game.id}_${pid}`]: { ...prev[`${game.id}_${pid}`], goals: parseInt(e.target.value) || 0 } }))}
                                                  className="w-10 bg-brutal-white border-2 border-brutal-black px-1 py-1 text-xs font-black text-center focus:bg-brutal-yellow"
                                                />
                                                <span className="text-xs font-black">G</span>
                                                <input
                                                  type="number" min="0"
                                                  value={editStats[`${game.id}_${pid}`]?.assists ?? 0}
                                                  onChange={(e) => setEditStats(prev => ({ ...prev, [`${game.id}_${pid}`]: { ...prev[`${game.id}_${pid}`], assists: parseInt(e.target.value) || 0 } }))}
                                                  className="w-10 bg-brutal-white border-2 border-brutal-black px-1 py-1 text-xs font-black text-center focus:bg-brutal-yellow"
                                                />
                                                <span className="text-xs font-black">A</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {match.teams.map((team) => {
                              const style = teamStyles[team.name] || teamStyles['Time A'];
                              return (
                                <div key={team.name} className={`${style.bg} border-4 ${style.border} p-4 shadow-[4px_4px_0_0_black]`}>
                                  <h4 className={`font-display font-black text-2xl mb-4 uppercase tracking-tighter ${style.text}`}>{team.name}</h4>
                                  <div className="space-y-4">
                                    {team.player_ids.map(pid => (
                                      <div key={pid} className="flex flex-col gap-2 bg-brutal-white border-2 border-brutal-black p-2">
                                        <span className="text-sm font-black text-brutal-black truncate">{getPlayerName(pid)}</span>
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="number" min="0"
                                            value={editStats[`all_${pid}`]?.goals ?? 0}
                                            onChange={(e) => setEditStats(prev => ({ ...prev, [`all_${pid}`]: { ...prev[`all_${pid}`], goals: parseInt(e.target.value) || 0 } }))}
                                            className="w-12 bg-brutal-white border-2 border-brutal-black p-1 text-sm font-black text-center"
                                          />
                                          <span className="text-xs font-black">G</span>
                                          <input
                                            type="number" min="0"
                                            value={editStats[`all_${pid}`]?.assists ?? 0}
                                            onChange={(e) => setEditStats(prev => ({ ...prev, [`all_${pid}`]: { ...prev[`all_${pid}`], assists: parseInt(e.target.value) || 0 } }))}
                                            className="w-12 bg-brutal-white border-2 border-brutal-black p-1 text-sm font-black text-center"
                                          />
                                          <span className="text-xs font-black">A</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        <div className="flex gap-4 mt-6">
                          <BrutalButton
                            variant="primary"
                            onClick={() => handleSaveStats(match.id)}
                            disabled={updateStatsMutation.isPending}
                            className="flex-1 text-sm"
                          >
                            {updateStatsMutation.isPending ? 'SALVANDO...' : 'SALVAR ESTATÍSTICAS'}
                          </BrutalButton>
                          <BrutalButton
                            variant="danger"
                            onClick={() => setEditingMatchId(null)}
                            className="px-8 text-sm"
                          >
                            CANCELAR
                          </BrutalButton>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {hasSchedule ? (
                          <div className="space-y-4 mb-6">
                            <h3 className="font-display text-xl font-black text-brutal-black uppercase tracking-widest">Partidas</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {match.schedule!.map((game, i) => {
                                let g1 = 0; let g2 = 0;
                                stats.filter(s => s.match_id === match.id && s.game_id === game.id).forEach(s => {
                                  if (s.team === game.team1) g1 += s.goals;
                                  if (s.team === game.team2) g2 += s.goals;
                                });
                                return (
                                  <div key={game.id} className="bg-brutal-white border-4 border-brutal-black flex items-center shadow-brutal-sm">
                                    <div className="bg-brutal-black text-brutal-white font-black px-3 py-4 text-center">
                                      #{i+1}
                                    </div>
                                    <div className="flex-1 p-2 flex flex-col justify-center">
                                      <div className="flex items-center justify-between px-2 font-black text-sm uppercase mb-1">
                                        <span className="flex items-center gap-2"><span className={`w-3 h-3 border-2 border-black ${teamStyles[game.team1]?.bg || teamStyles[`Time ${game.team1}`]?.bg}`}></span> {game.team1}</span>
                                        <span className="text-xl">{g1}</span>
                                      </div>
                                      <div className="flex items-center justify-between px-2 font-black text-sm uppercase">
                                        <span className="flex items-center gap-2"><span className={`w-3 h-3 border-2 border-black ${teamStyles[game.team2]?.bg || teamStyles[`Time ${game.team2}`]?.bg}`}></span> {game.team2}</span>
                                        <span className="text-xl">{g2}</span>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            {match.teams.map((team) => {
                              const normalizedName = team.name.startsWith('Time ') ? team.name : `Time ${team.name}`;
                              const style = teamStyles[normalizedName] || teamStyles['Time A'];
                              return (
                                <div key={team.name} className={`${style.bg} border-4 ${style.border} p-4 shadow-[4px_4px_0_0_black]`}>
                                  <h4 className={`font-display font-black text-2xl mb-4 uppercase tracking-tighter ${style.text}`}>{normalizedName}</h4>
                                  <div className="space-y-3">
                                    {team.player_ids.map(pid => {
                                      const stat = stats.find(s => s.match_id === match.id && s.player_id === pid);
                                      return (
                                        <div key={pid} className="flex items-center justify-between text-sm bg-brutal-white border-2 border-brutal-black p-2">
                                          <span className="text-brutal-black font-black truncate flex-1 mr-2 uppercase">{getPlayerName(pid)}</span>
                                          <span className="flex-shrink-0 flex items-center gap-2">
                                            {stat?.goals ? <span className="text-brutal-black font-black">{stat.goals} ⚽</span> : null}
                                            {stat?.assists ? <span className="text-brutal-black font-black">{stat.assists} 👟</span> : null}
                                            {!stat?.goals && !stat?.assists && <span className="text-brutal-black/50 font-black">—</span>}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <BrutalButton
                          variant="warning"
                          onClick={() => handleEdit(match)}
                          className="py-3 px-6 text-sm"
                        >
                          EDITAR GOLS / ASSISTÊNCIAS
                        </BrutalButton>
                      </div>
                    )}
                  </div>
                )}
              </BrutalCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
