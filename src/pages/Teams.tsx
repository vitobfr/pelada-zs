import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import type { MatchTeam } from '../lib/types';
import { Avatar } from '../components/Avatar';
import { BrutalCard } from '../components/ui/BrutalCard';
import { BrutalButton } from '../components/ui/BrutalButton';
import { BrutalInput } from '../components/ui/BrutalInput';
import { Spinner } from '../components/ui/Spinner';
import Modal from '../components/Modal';

const teamStyles = [
  { bg: 'bg-brutal-red', text: 'text-white', border: 'border-brutal-black', label: 'Time A' },
  { bg: 'bg-brutal-blue', text: 'text-white', border: 'border-brutal-black', label: 'Time B' },
  { bg: 'bg-brutal-yellow', text: 'text-brutal-black', border: 'border-brutal-black', label: 'Time C' },
  { bg: 'bg-brutal-green', text: 'text-brutal-black', border: 'border-brutal-black', label: 'Time D' },
];

const teamNames = ['Time A', 'Time B', 'Time C', 'Time D'];

export default function Teams() {
  const { player, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: matches = [], isLoading: loadingMatches } = useQuery({
    queryKey: ['matches'],
    queryFn: api.getMatches,
  });

  const { data: players = [], isLoading: loadingPlayers } = useQuery({
    queryKey: ['players'],
    queryFn: api.getPlayers,
  });

  const loading = loadingMatches || loadingPlayers;

  const [drawing, setDrawing] = useState(false);
  const [previewTeams, setPreviewTeams] = useState<MatchTeam[] | null>(null);
  const [description, setDescription] = useState('');
  const [msg, setMsg] = useState('');
  const [drawModal, setDrawModal] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [totalTime, setTotalTime] = useState(120);
  const [matchTime, setMatchTime] = useState(10);
  const [schedule, setSchedule] = useState<import('../lib/types').Game[]>([]);

  const togglePlayer = (id: string) => {
    const next = new Set(selectedPlayers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedPlayers(next);
  };

  const openDrawModal = () => {
    setSelectedPlayers(new Set(players.map(p => p.id)));
    setDrawModal(true);
  };

  const handleDraw = async () => {
    const selectedList = Array.from(selectedPlayers);
    if (selectedList.length < 4) {
      setMsg('PRECISA DE PELO MENOS 4 JOGADORES SELECIONADOS.');
      return;
    }
    setDrawing(true);
    setMsg('');
    try {
      const result = await api.drawTeams(selectedList);
      setPreviewTeams(result.teams);

      const totalMatches = matchTime > 0 ? Math.floor(totalTime / matchTime) : 0;
      const newSchedule = [];
      const combinations = [
        ['Time A', 'Time B'], ['Time C', 'Time D'],
        ['Time A', 'Time C'], ['Time B', 'Time D'],
        ['Time A', 'Time D'], ['Time B', 'Time C']
      ];
      if (totalMatches > 0) {
        for (let i = 0; i < totalMatches; i++) {
          const pair = combinations[i % combinations.length];
          newSchedule.push({
            id: crypto.randomUUID(),
            team1: pair[0],
            team2: pair[1]
          });
        }
      }
      setSchedule(newSchedule);
      setDrawModal(false);
    } catch {
      setMsg('ERRO AO SORTEAR.');
    } finally {
      setDrawing(false);
    }
  };

  const createMatchMutation = useMutation({
    mutationFn: () => api.createMatch(player!.id, previewTeams!, description.trim(), schedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      setPreviewTeams(null);
      setSchedule([]);
      setDescription('');
      setMsg('PARTIDA CRIADA!');
      setTimeout(() => setMsg(''), 3000);
    },
    onError: () => {
      setMsg('ERRO AO SALVAR.');
    }
  });

  const deleteMatchMutation = useMutation({
    mutationFn: (matchId: string) => api.deleteMatch(matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      setMsg('PARTIDA DELETADA!');
      setTimeout(() => setMsg(''), 3000);
    },
    onError: () => {
      setMsg('ERRO AO DELETAR.');
    }
  });

  const handleSaveMatch = () => {
    if (!player || !previewTeams) return;
    setMsg('');
    createMatchMutation.mutate();
  };

  const getPlayerName = (id: string) => {
    const p = players.find(pl => pl.id === id);
    if (!p) return '?';
    return (
      <div className="flex items-center gap-2">
        {p.has_avatar ? (
          <Avatar id={p.id} className="w-8 h-8 object-cover border-2 border-brutal-black" />
        ) : (
          <div className="w-8 h-8 border-2 border-brutal-black bg-white flex items-center justify-center text-brutal-black text-xs font-black">
            {(p.nickname || p.username)[0]?.toUpperCase()}
          </div>
        )}
        <span className="font-black uppercase tracking-widest">{p.nickname || p.username}</span>
      </div>
    );
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl font-black text-brutal-black uppercase tracking-tighter bg-brutal-yellow px-4 py-1 border-4 border-brutal-black inline-block shadow-brutal-sm -rotate-1">
          Escalação
        </h1>
      </div>

      {msg && (
        <div className={`p-4 border-4 border-brutal-black text-lg font-black uppercase tracking-widest flex items-center gap-2 shadow-brutal-sm ${
          msg.includes('ERRO') || msg.includes('PRECISA')
            ? 'bg-brutal-red text-white'
            : 'bg-brutal-green text-brutal-black'
        }`}>
          {msg.includes('ERRO') || msg.includes('PRECISA') ? (
            <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 5h2v4H7V5zm0 5h2v2H7v-2z"/></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 100 16A8 8 0 008 0zM7 11h2v2H7v-2zm0-8h2v6H7V3z"/></svg>
          )}
          {msg}
        </div>
      )}

      {isAdmin && (
        <BrutalCard className="p-6">
          <h2 className="font-display text-2xl font-black text-brutal-black mb-2 flex items-center gap-2 uppercase tracking-widest border-b-4 border-brutal-black pb-2">
            <span>🎲</span> Sorteio de Times
          </h2>
          <p className="text-brutal-black font-bold uppercase tracking-widest mb-6 bg-brutal-bg p-2 border-2 border-brutal-black inline-block">
            Balanceados automaticamente por nível
          </p>

          {previewTeams ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {previewTeams.map((team, i) => (
                  <div key={team.name} className={`${teamStyles[i].bg} border-4 ${teamStyles[i].border} p-4 shadow-brutal-sm hover:-translate-y-1 hover:shadow-brutal transition-all`}>
                    <div className={`font-display font-black text-2xl ${teamStyles[i].text} mb-4 uppercase tracking-tighter drop-shadow-[2px_2px_0_rgba(0,0,0,1)]`}>
                      {teamStyles[i].label} <span className="text-lg">({team.player_ids.length})</span>
                    </div>
                    <div className="space-y-2">
                      {team.player_ids.map((pid, idx) => (
                        <div key={pid} className="bg-brutal-white border-2 border-brutal-black p-2 flex items-center gap-2">
                          <span className="text-brutal-black font-black w-4">{idx + 1}</span>
                          {getPlayerName(pid)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mb-6">
                <BrutalInput
                  label="Descrição"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="EX: SÁBADO 14H..."
                />
              </div>
              <div className="flex gap-4">
                <BrutalButton
                  variant="primary"
                  onClick={handleSaveMatch}
                  disabled={createMatchMutation.isPending}
                  className="flex-1"
                >
                  {createMatchMutation.isPending ? 'SALVANDO...' : 'SALVAR PARTIDA'}
                </BrutalButton>
                <BrutalButton
                  variant="danger"
                  onClick={() => {
                    setPreviewTeams(null);
                    setSchedule([]);
                  }}
                >
                  CANCELAR
                </BrutalButton>
              </div>
            </>
          ) : (
            <BrutalButton
              variant="warning"
              onClick={openDrawModal}
              className="w-full text-2xl py-6 flex items-center justify-center gap-4"
            >
              🎲 SORTEAR JOGADORES EM 4 TIMES
            </BrutalButton>
          )}
        </BrutalCard>
      )}

      {/* Latest Match Escalação */}
      <div>
        <h2 className="font-display text-2xl font-black text-brutal-black mb-6 flex items-center gap-2 uppercase tracking-widest">
          <span>🔥</span> Escalação Oficial
        </h2>
        {matches.length === 0 ? (
          <BrutalCard className="p-12 text-center">
            <div className="text-6xl mb-6">⚽</div>
            <p className="text-brutal-black text-2xl font-black uppercase tracking-widest">Nenhuma escalação registrada.</p>
            {isAdmin && <p className="text-brutal-black font-bold uppercase mt-2 bg-brutal-yellow inline-block px-2 border-2 border-brutal-black">Use o sorteio acima!</p>}
          </BrutalCard>
        ) : (
          <div className="space-y-8">
            {matches.slice(0, 1).map(m => (
              <div key={m.id} className="space-y-8">
                <BrutalCard className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b-4 border-brutal-black">
                    <div>
                      <p className="font-black text-brutal-black text-2xl uppercase tracking-widest">
                        {new Date(m.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {m.description && <p className="text-xl font-bold text-brutal-black/70 uppercase tracking-widest mt-1">{m.description}</p>}
                    </div>
                    {isAdmin && (
                      <BrutalButton 
                        variant="danger" 
                        onClick={() => {
                          if(window.confirm('Tem certeza que deseja apagar essa partida?')) {
                            deleteMatchMutation.mutate(m.id);
                          }
                        }}
                      >
                        🗑️ APAGAR
                      </BrutalButton>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {m.teams.map((team, i) => (
                      <div key={team.name} className={`${teamStyles[i].bg} border-4 ${teamStyles[i].border} p-4 shadow-[4px_4px_0_0_black]`}>
                        <div className={`font-display font-black text-2xl mb-4 uppercase tracking-tighter drop-shadow-[2px_2px_0_rgba(0,0,0,1)] ${teamStyles[i].text}`}>
                          {teamStyles[i].label}
                        </div>
                        <div className="space-y-2">
                          {team.player_ids.map((pid, idx) => (
                            <div key={pid} className="bg-brutal-white border-2 border-brutal-black p-2 flex items-center gap-2">
                              <span className="text-brutal-black font-black w-4">{idx + 1}</span>
                              {getPlayerName(pid)}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {m.schedule && m.schedule.length > 0 && (
                    <div className="mt-8">
                      <h3 className="font-display text-xl font-black text-brutal-black mb-4 uppercase tracking-widest border-b-4 border-brutal-black pb-2 inline-block">
                        ⚔️ Chaveamento / Confrontos
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {m.schedule.map((game, idx) => {
                          const t1Info = teamStyles[teamNames.indexOf(game.team1)] || teamStyles[0];
                          const t2Info = teamStyles[teamNames.indexOf(game.team2)] || teamStyles[1];
                          return (
                            <div key={game.id} className="bg-brutal-bg border-4 border-brutal-black p-4 flex flex-col items-center justify-center shadow-brutal-sm relative">
                              <span className="absolute top-0 left-0 bg-brutal-black text-white text-xs font-black px-2 py-1">JOGO {idx + 1}</span>
                              <div className="flex items-center gap-3 mt-4 w-full">
                                <div className={`${t1Info.bg} ${t1Info.text} font-black uppercase text-center flex-1 border-2 border-brutal-black p-2 truncate`}>{t1Info.label}</div>
                                <span className="font-black text-brutal-black text-xl italic">X</span>
                                <div className={`${t2Info.bg} ${t2Info.text} font-black uppercase text-center flex-1 border-2 border-brutal-black p-2 truncate`}>{t2Info.label}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </BrutalCard>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Draw Config Modal */}
      <Modal 
        open={drawModal} 
        onClose={() => setDrawModal(false)} 
        title="CONFIGURAR SORTEIO" 
        maxWidth="max-w-4xl"
        footer={
          <BrutalButton
            variant="warning"
            className="w-full text-xl py-4"
            onClick={handleDraw}
            disabled={drawing}
          >
            {drawing ? 'GERANDO...' : `🎲 GERAR TIMES (${selectedPlayers.size} JOGADORES)`}
          </BrutalButton>
        }
      >
        <div className="space-y-6">
          <div className="flex gap-4">
            <BrutalInput
              type="number"
              label="Tempo Total (min)"
              value={totalTime}
              onChange={e => setTotalTime(Number(e.target.value) || 0)}
              containerClassName="flex-1"
            />
            <BrutalInput
              type="number"
              label="Tempo por Jogo (min)"
              value={matchTime}
              onChange={e => setMatchTime(Number(e.target.value) || 0)}
              containerClassName="flex-1"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-xl text-brutal-black uppercase">Selecionar Participantes</h3>
              <span className="bg-brutal-black text-brutal-white px-2 py-1 font-bold">{selectedPlayers.size} SELECIONADOS</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {players.map(p => {
                const isSelected = selectedPlayers.has(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlayer(p.id)}
                    className={`flex items-center gap-3 border-4 border-brutal-black px-3 py-2 transition-all cursor-pointer text-left ${isSelected ? 'bg-brutal-green shadow-[4px_4px_0_0_black] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_black]' : 'bg-brutal-bg opacity-50 grayscale hover:opacity-100 hover:grayscale-0'}`}
                  >
                    <div className={`w-6 h-6 border-2 border-brutal-black flex items-center justify-center ${isSelected ? 'bg-brutal-black text-brutal-white' : 'bg-white'}`}>
                      {isSelected && '✓'}
                    </div>
                    {p.has_avatar ? (
                      <Avatar id={p.id} className="w-10 h-10 object-cover border-2 border-brutal-black" />
                    ) : (
                      <div className="w-10 h-10 border-2 border-brutal-black bg-brutal-white flex items-center justify-center text-brutal-black font-black flex-shrink-0">
                        {(p.nickname || p.username)[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-black text-brutal-black truncate uppercase">{p.nickname || p.username}</div>
                      <div className="text-xs font-bold text-brutal-black bg-brutal-white inline-block px-1 border border-brutal-black">NVL: {p.avg_rating.toFixed(1)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
