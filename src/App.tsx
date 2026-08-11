import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Players from './pages/Players';
import Teams from './pages/Teams';
import History from './pages/History';
import Ranking from './pages/Ranking';
import { Toaster } from 'react-hot-toast';
import { Spinner } from './components/ui/Spinner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { player, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brutal-bg">
        <Spinner />
      </div>
    );
  }
  if (!player) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#112240', color: '#EDF2F7', border: '2px solid #000' }
        }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/perfil" element={<Profile />} />
            <Route path="/perfil/:id" element={<Profile />} />
            <Route path="/jogadores" element={<Players />} />
            <Route path="/times" element={<Teams />} />
            <Route path="/historico" element={<History />} />
            <Route path="/ranking" element={<Ranking />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </QueryClientProvider>
  );
}
