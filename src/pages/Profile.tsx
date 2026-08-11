import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import AvatarUpload from '../components/AvatarUpload';
import { Avatar } from '../components/Avatar';
import StarRating from '../components/StarRating';
import toast from 'react-hot-toast';
import { BrutalCard } from '../components/ui/BrutalCard';
import { BrutalInput } from '../components/ui/BrutalInput';
import { BrutalButton } from '../components/ui/BrutalButton';
import { Spinner } from '../components/ui/Spinner';

export default function Profile() {
  const { id } = useParams<{ id?: string }>();
  const { player, playerWithStats, refreshPlayer } = useAuth();
  const isOwnProfile = !id || id === player?.id;

  const { data: profile, isLoading } = useQuery({
    queryKey: ['player', id],
    queryFn: () => api.getPlayer(id!),
    enabled: !isOwnProfile && !!id,
  });

  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [selfRating, setSelfRating] = useState(0);

  const updateMutation = useMutation({
    mutationFn: (data: { nickname: string; self_rating: number }) =>
      api.updatePlayer(player!.id, data),
    onMutate: () => {
      setEditing(false); // Optimistic UI close
    },
    onSuccess: async () => {
      await refreshPlayer();
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: () => {
      setEditing(true);
      toast.error('Erro ao salvar perfil.');
    }
  });

  const handleSave = () => {
    if (!player) return;
    updateMutation.mutate({
      nickname: (nickname || '').trim() || player.nickname,
      self_rating: selfRating,
    });
  };

  const avatarMutation = useMutation({
    mutationFn: api.updateAvatar,
    onSuccess: async () => {
      await refreshPlayer();
      toast.success('Foto atualizada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao salvar foto.');
    }
  });

  const handleAvatar = (base64: string) => {
    if (!player) return;
    toast.loading('Salvando foto...', { id: 'avatar' });
    avatarMutation.mutate(base64, {
      onSettled: () => toast.dismiss('avatar')
    });
  };

  if (isLoading && !isOwnProfile) return <Spinner />;

  const displayPlayer = isOwnProfile ? player : profile;

  if (!displayPlayer) {
    return (
      <BrutalCard className="text-center py-20 max-w-lg mx-auto p-10">
        <div className="text-8xl mb-6 animate-bounce">⚽</div>
        <p className="text-brutal-black text-2xl font-black uppercase tracking-widest">Jogador não encontrado.</p>
      </BrutalCard>
    );
  }

  const stats = isOwnProfile ? playerWithStats : profile;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <BrutalCard className="p-8">
        {/* Avatar & Identity */}
        <div className="flex flex-col items-center mb-8">
          {isOwnProfile ? (
            <AvatarUpload
              playerId={displayPlayer.id}
              hasAvatar={displayPlayer.has_avatar}
              onUpload={handleAvatar}
              nickname={displayPlayer.nickname}
              username={displayPlayer.username}
            />
          ) : (
            <div>
              {displayPlayer.has_avatar ? (
                <Avatar id={displayPlayer.id} className="w-32 h-32 object-cover border-4 border-brutal-black shadow-[4px_4px_0_0_black]" />
              ) : (
                <div className="w-32 h-32 border-4 border-brutal-black bg-brutal-green flex items-center justify-center text-brutal-black text-5xl font-black shadow-brutal">
                  {(displayPlayer.nickname || displayPlayer.username)[0]?.toUpperCase()}
                </div>
              )}
            </div>
          )}
          <h2 className="text-4xl font-display font-black text-brutal-black mt-6 tracking-tighter uppercase bg-brutal-yellow px-4 py-1 border-2 border-brutal-black -rotate-1 inline-block shadow-brutal-sm">
            {displayPlayer.nickname || displayPlayer.username}
          </h2>
          <p className="text-brutal-black font-bold text-lg mt-4 uppercase tracking-widest bg-brutal-bg px-2 border-2 border-brutal-black">@{displayPlayer.username}</p>
          <div className="mt-4 bg-brutal-black p-2 shadow-brutal-sm">
            <StarRating value={Math.round(isOwnProfile ? (stats?.avg_rating ?? displayPlayer.self_rating) : (stats?.avg_rating ?? 0))} readonly size="lg" />
          </div>
        </div>

        {/* Edit Section (own profile only) */}
        {isOwnProfile && player && (
          <div className="border-t-4 border-brutal-black pt-8">
            {!editing ? (
              <>
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-brutal-bg border-4 border-brutal-black px-4 py-3 shadow-brutal-sm hover:-translate-y-1 hover:shadow-brutal transition-all">
                    <span className="text-brutal-black text-lg font-black uppercase tracking-widest">Apelido</span>
                    <span className="text-brutal-black text-lg font-black uppercase bg-brutal-white px-2 py-1 border-2 border-brutal-black">{player.nickname || player.username}</span>
                  </div>
                  <div className="flex justify-between items-center bg-brutal-bg border-4 border-brutal-black px-4 py-3 shadow-brutal-sm hover:-translate-y-1 hover:shadow-brutal transition-all">
                    <span className="text-brutal-black text-lg font-black uppercase tracking-widest">Autoavaliação</span>
                    <div className="bg-brutal-black p-1 px-2"><StarRating value={player.self_rating} readonly size="md" /></div>
                  </div>
                </div>
                <BrutalButton
                  variant="secondary"
                  onClick={() => {
                    setNickname(player.nickname || '');
                    setSelfRating(player.self_rating || 0);
                    setEditing(true);
                  }}
                  className="mt-8 w-full text-xl hover:bg-brutal-yellow"
                >
                  EDITAR PERFIL
                </BrutalButton>
              </>
            ) : (
              <div className="space-y-6 bg-brutal-bg p-6 border-4 border-brutal-black shadow-brutal-sm">
                <BrutalInput
                  label="Apelido"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={player.username}
                />
                <div>
                  <label className="block text-xl font-black text-brutal-black mb-2 uppercase tracking-widest">Autoavaliação</label>
                  <div className="bg-brutal-black p-3 inline-block">
                     <StarRating value={selfRating} onChange={setSelfRating} size="lg" />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <BrutalButton
                    variant="primary"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="flex-1"
                  >
                    {updateMutation.isPending ? 'SALVANDO...' : 'SALVAR'}
                  </BrutalButton>
                  <BrutalButton
                    variant="danger"
                    onClick={() => setEditing(false)}
                    className="flex-1"
                  >
                    CANCELAR
                  </BrutalButton>
                </div>
              </div>
            )}
          </div>
        )}
      </BrutalCard>

      {/* Stats */}
      {stats && (
        <div className="bg-brutal-yellow border-4 border-brutal-black p-8 shadow-brutal-lg">
          <h3 className="font-display text-3xl font-black text-brutal-black mb-8 uppercase tracking-tighter inline-block bg-brutal-white border-2 border-brutal-black px-4 py-1 -rotate-2">
            Estatísticas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center bg-brutal-white p-6 border-4 border-brutal-black shadow-[4px_4px_0_0_black] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_black] transition-all">
              <div className="text-6xl font-display font-black text-brutal-black">{stats.total_goals}</div>
              <div className="text-lg text-brutal-black mt-2 uppercase tracking-widest font-black border-t-4 border-brutal-black pt-2">Gols</div>
            </div>
            <div className="text-center bg-brutal-green p-6 border-4 border-brutal-black shadow-[4px_4px_0_0_black] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_black] transition-all">
              <div className="text-6xl font-display font-black text-brutal-black">{stats.total_assists}</div>
              <div className="text-lg text-brutal-black mt-2 uppercase tracking-widest font-black border-t-4 border-brutal-black pt-2">Assist.</div>
            </div>
            <div className="text-center bg-brutal-white p-6 border-4 border-brutal-black shadow-[4px_4px_0_0_black] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_black] transition-all">
              <div className="text-6xl font-display font-black text-brutal-black">{stats.matches_played}</div>
              <div className="text-lg text-brutal-black mt-2 uppercase tracking-widest font-black border-t-4 border-brutal-black pt-2">Partidas</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
