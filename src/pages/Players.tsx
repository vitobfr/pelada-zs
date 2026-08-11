import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import PlayerCard from '../components/PlayerCard';
import Modal from '../components/Modal';
import StarRating from '../components/StarRating';
import { BrutalInput } from '../components/ui/BrutalInput';
import { BrutalButton } from '../components/ui/BrutalButton';
import { BrutalBadge } from '../components/ui/BrutalBadge';
import { Spinner } from '../components/ui/Spinner';

export default function Players() {
  const { player, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: api.getPlayers
  });

  const [search, setSearch] = useState('');
  const [ratingModal, setRatingModal] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingMsg, setRatingMsg] = useState('');
  const [ratedPlayerName, setRatedPlayerName] = useState('');

  // Admin stats editor states
  const [editingStatsId, setEditingStatsId] = useState<string | null>(null);
  const [manualGoals, setManualGoals] = useState(0);
  const [manualAssists, setManualAssists] = useState(0);
  const [manualMatches, setManualMatches] = useState(0);

  const addAdminMutation = useMutation({
    mutationFn: api.addAdmin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['players'] })
  });

  const removeAdminMutation = useMutation({
    mutationFn: api.removeAdmin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['players'] })
  });

  const updateStatsMutation = useMutation({
    mutationFn: (data: { playerId: string; manual_goals: number; manual_assists: number; manual_matches: number }) => 
      api.updatePlayer(data.playerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setEditingStatsId(null);
    }
  });

  const deletePlayerMutation = useMutation({
    mutationFn: api.deletePlayer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['players'] })
  });

  const handleOpenRate = (playerId: string) => {
    const p = players.find(pl => pl.id === playerId);
    setRatedPlayerName(p?.nickname || p?.username || '');
    setRatingModal(playerId);
    setRatingValue(0);
    setRatingMsg('');
  };

  const openStatsEditor = (p: typeof players[0]) => {
    setEditingStatsId(p.id);
    setManualGoals(p.manual_goals || 0);
    setManualAssists(p.manual_assists || 0);
    setManualMatches(p.manual_matches || 0);
  };

  const rateMutation = useMutation({
    mutationFn: (vars: { raterId: string; ratedId: string; rating: number }) =>
      api.ratePlayer(vars.raterId, vars.ratedId, vars.rating),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['players'] });
      setRatingModal(null);
    },
    onError: (err) => {
      setRatingMsg(err instanceof Error ? err.message : 'Erro ao avaliar.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    }
  });

  const handleRate = () => {
    if (!player || !ratingModal || ratingValue === 0) return;
    setRatingMsg('');
    rateMutation.mutate({ raterId: player.id, ratedId: ratingModal, rating: ratingValue });
  };

  const filtered = search.trim()
    ? players.filter(p =>
        p.username.toLowerCase().includes(search.toLowerCase()) ||
        p.nickname.toLowerCase().includes(search.toLowerCase())
      )
    : players;

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-display text-4xl font-black text-brutal-black uppercase tracking-tighter bg-brutal-yellow px-4 py-1 border-4 border-brutal-black inline-block shadow-brutal-sm -rotate-1">
          Jogadores
        </h1>
        <BrutalBadge variant="white" className="text-xl px-4 py-2">
          {players.length} na quadra
        </BrutalBadge>
      </div>

      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-brutal-black z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <BrutalInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="BUSCAR JOGADOR..."
          className="pl-12"
        />
      </div>

      <div className="space-y-4">
        {filtered.map(p => (
          <div key={p.id} className="space-y-2">
            <PlayerCard
              player={p}
              currentPlayerId={player?.id}
              showRateButton
              onRate={handleOpenRate}
            />
            {isAdmin && (
              <div className="flex flex-wrap gap-2 px-2">
                <BrutalButton 
                  variant="primary" 
                  className="text-xs py-1 px-3 flex-1"
                  onClick={() => openStatsEditor(p)}
                >
                  ✏️ EDITAR STATS
                </BrutalButton>
                {p.is_admin ? (
                  <BrutalButton 
                    variant="warning" 
                    className="text-xs py-1 px-3 flex-1"
                    onClick={() => removeAdminMutation.mutate(p.id)}
                  >
                    🔻 REVOGAR ADMIN
                  </BrutalButton>
                ) : (
                  <BrutalButton 
                    variant="primary" 
                    className="text-xs py-1 px-3 flex-1"
                    onClick={() => addAdminMutation.mutate(p.id)}
                  >
                    ⭐ TORNAR ADMIN
                  </BrutalButton>
                )}
                <BrutalButton 
                  variant="danger" 
                  className="text-xs py-1 px-3 flex-1"
                  onClick={() => {
                    if(window.confirm(`Tem certeza que deseja apagar ${p.username}?`)) {
                      deletePlayerMutation.mutate(p.id);
                    }
                  }}
                >
                  🗑️ EXCLUIR
                </BrutalButton>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-brutal-white border-4 border-brutal-black p-12 text-center shadow-brutal">
            <div className="text-6xl mb-6">🔍</div>
            <p className="text-brutal-black text-2xl font-black uppercase tracking-widest">Nenhum jogador encontrado.</p>
          </div>
        )}
      </div>

      <Modal open={!!ratingModal} onClose={() => setRatingModal(null)} title={`AVALIAR ${ratedPlayerName}`}>
        <div className="flex flex-col items-center gap-6">
          <p className="text-brutal-black text-lg font-bold text-center uppercase tracking-widest border-b-4 border-brutal-black pb-2">
            Qual o nível de <strong className="font-black bg-brutal-yellow px-1">{ratedPlayerName}</strong> de 1 a 5?
          </p>
          <div className="bg-brutal-black p-4 inline-block shadow-[4px_4px_0_0_#F5A623]">
            <StarRating value={ratingValue} onChange={setRatingValue} size="lg" />
          </div>
          {ratingMsg && (
            <div className="flex items-center gap-2 text-brutal-white bg-brutal-red border-4 border-brutal-black p-3 text-lg font-bold w-full uppercase tracking-widest shadow-brutal-sm">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 5h2v4H7V5zm0 5h2v2H7v-2z"/>
              </svg>
              {ratingMsg}
            </div>
          )}
          <BrutalButton
            onClick={handleRate}
            disabled={ratingValue === 0}
            className="w-full text-xl"
          >
            CONFIRMAR NOTA
          </BrutalButton>
        </div>
      </Modal>

      {/* Admin Stats Editor Modal */}
      <Modal open={!!editingStatsId} onClose={() => setEditingStatsId(null)} title="EDITAR ESTATÍSTICAS MANUAIS">
        <div className="space-y-4">
          <p className="text-brutal-black font-bold uppercase tracking-widest text-sm mb-4">
            Valores adicionados manualmente (somados aos jogos oficiais).
          </p>
          <BrutalInput
            type="number"
            label="GOLS (BÔNUS)"
            value={manualGoals}
            onChange={(e) => setManualGoals(Number(e.target.value))}
          />
          <BrutalInput
            type="number"
            label="ASSISTÊNCIAS (BÔNUS)"
            value={manualAssists}
            onChange={(e) => setManualAssists(Number(e.target.value))}
          />
          <BrutalInput
            type="number"
            label="PARTIDAS JOGADAS (BÔNUS)"
            value={manualMatches}
            onChange={(e) => setManualMatches(Number(e.target.value))}
          />
          <BrutalButton
            variant="primary"
            className="w-full mt-4"
            disabled={updateStatsMutation.isPending}
            onClick={() => {
              if (editingStatsId) {
                updateStatsMutation.mutate({
                  playerId: editingStatsId,
                  manual_goals: manualGoals,
                  manual_assists: manualAssists,
                  manual_matches: manualMatches
                });
              }
            }}
          >
            {updateStatsMutation.isPending ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
          </BrutalButton>
        </div>
      </Modal>
    </div>
  );
}
