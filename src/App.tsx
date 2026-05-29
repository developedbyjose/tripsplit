import { Providers } from './app/Providers';
import { useAuth } from './hooks/useAuth';
import { Login } from './features/auth/Login';
import { AppLayout } from './components/AppLayout';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center gap-3">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <h1 className="text-white text-base font-bold font-display tracking-wide">TripSplit</h1>
        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Loading Session...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <AppLayout />;
}

export default function App() {
  return (
    <Providers>
      <AppContent />
    </Providers>
  );
}
