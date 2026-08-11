import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from './Avatar';
import { BrutalButton } from './ui/BrutalButton';

const navItems = [
  { path: '/perfil', label: 'Perfil', icon: '👤' },
  { path: '/jogadores', label: 'Jogadores', icon: '👥' },
  { path: '/times', label: 'Escalação', icon: '⚽' },
  { path: '/historico', label: 'Histórico', icon: '📋' },
  { path: '/ranking', label: 'Ranking', icon: '🏆' },
];

export default function Layout() {
  const { player, isAdmin, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-brutal-white border-b-4 border-brutal-black sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/perfil" className="flex items-center gap-3 no-underline group active:translate-y-1 transition-transform">
            <div className="w-10 h-10 bg-brutal-green border-2 border-brutal-black shadow-brutal-sm flex items-center justify-center group-active:shadow-none transition-shadow overflow-hidden">
              <img src="/favicon.jpg" alt="Pelada ZS Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-display text-xl font-extrabold tracking-tight text-brutal-black hidden sm:block">
              PELADA ZS
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map(item => {
              const isActive = location.pathname === item.path || (item.path === '/perfil' && location.pathname.startsWith('/perfil'));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 border-2 border-brutal-black font-bold text-sm transition-all duration-150 no-underline flex items-center gap-2 ${
                    isActive
                      ? 'bg-brutal-green text-brutal-black shadow-brutal-sm translate-x-[-2px] translate-y-[-2px]'
                      : 'bg-brutal-white text-brutal-black hover:bg-brutal-bg hover:-translate-y-1 hover:shadow-brutal-sm active:translate-y-0 active:shadow-none'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User & Logout */}
          <div className="flex items-center gap-4">
            {player && (
              <Link to="/perfil" className="flex items-center gap-3 no-underline group active:translate-y-1 transition-transform">
                {player.has_avatar ? (
                  <Avatar id={player.id} className="w-10 h-10 object-cover border-2 border-brutal-black shadow-brutal-sm group-active:shadow-none transition-shadow" />
                ) : (
                  <div className="w-10 h-10 border-2 border-brutal-black bg-brutal-bg shadow-brutal-sm flex items-center justify-center text-brutal-black font-bold group-active:shadow-none transition-shadow">
                    {(player.nickname || player.username)[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-bold text-brutal-black hidden sm:block">
                  {player.nickname || player.username}
                </span>
              </Link>
            )}
            <BrutalButton variant="danger" onClick={logout} className="py-2 px-4 text-sm font-bold border-2 shadow-brutal-sm">
              SAIR
            </BrutalButton>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden border-t-2 border-brutal-black bg-brutal-white overflow-x-auto">
          <div className="flex px-2 py-3 gap-2">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-1.5 border-2 border-brutal-black font-bold text-xs whitespace-nowrap transition-all duration-150 no-underline flex items-center gap-1 ${
                    isActive
                      ? 'bg-brutal-green text-brutal-black shadow-[2px_2px_0px_0px_black]'
                      : 'bg-brutal-white text-brutal-black active:translate-y-1 active:shadow-none shadow-[2px_2px_0px_0px_black]'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 md:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-brutal-black bg-brutal-white py-6 text-center mt-auto">
        <p className="text-sm font-bold text-brutal-black uppercase tracking-wide">
          Pelada ZS &copy; {new Date().getFullYear()} &mdash; Onde os craques se encontram
        </p>
      </footer>
    </div>
  );
}
