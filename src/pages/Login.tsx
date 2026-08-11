import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { BrutalCard } from '../components/ui/BrutalCard';
import { BrutalInput } from '../components/ui/BrutalInput';
import { BrutalButton } from '../components/ui/BrutalButton';

export default function Login() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUser = username.trim();
    
    if (!trimmedUser) {
      toast.error('Digite um nome de usuário.');
      return;
    }

    setLoading(true);
    try {
      await login(trimmedUser);
      toast.success('Login efetuado com sucesso!');
      navigate('/perfil');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brutal-bg px-4 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-28 h-28 bg-brutal-green mb-6 border-4 border-brutal-black shadow-brutal-lg -rotate-3 hover:rotate-0 transition-transform duration-200 overflow-hidden">
            <img src="/favicon.jpg" alt="Pelada ZS Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-display text-5xl font-black text-brutal-black uppercase tracking-tighter drop-shadow-[4px_4px_0_rgba(0,255,65,1)]">
            Pelada ZS
          </h1>
          <p className="text-brutal-black mt-2 text-xl font-bold border-t-4 border-b-4 border-brutal-black bg-brutal-yellow inline-block px-4 py-1 -rotate-2">
            BÓ JOGA BOLA
          </p>
        </div>

        {/* Form Card */}
        <BrutalCard className="p-8 relative">
          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <BrutalInput
                label="Nome de Usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuário..."
                autoFocus
              />
            </div>

            <BrutalButton
              type="submit"
              disabled={loading}
              className="w-full text-xl"
            >
              {loading ? 'ENTRANDO...' : 'ENTRAR NO CAMPO'}
            </BrutalButton>
          </form>
        </BrutalCard>

        {/* Footer */}
        <p className="text-center font-bold text-sm text-brutal-black mt-8 uppercase tracking-widest bg-brutal-white border-2 border-brutal-black px-4 py-2 inline-block mx-auto shadow-brutal-sm">
          Primeira vez? Conta automática.
        </p>
      </div>
    </div>
  );
}
