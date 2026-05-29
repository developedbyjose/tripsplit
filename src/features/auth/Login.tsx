import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogIn, UserPlus, Compass, ShieldAlert, Sparkles } from 'lucide-react';

export function Login() {
  const { signIn, signUp, loginAsSandboxUser } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error('Name is required');
        const { error: signUpError } = await signUp(email, password, name);
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await signIn(email, password);
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message || 'An authentication error occurred');
    } finally {
      setLoading(false);
    }
  }

  // Pre-configured users for easy sandbox previewing
  const demoUsers = [
    { name: 'James', email: 'james@tripsplit.io', label: 'James ✈️ (Owner)' },
    { name: 'Jose', email: 'jose@tripsplit.io', label: 'Jose 🎒 (Admin)' },
    { name: 'Gly', email: 'gly@tripsplit.io', label: 'Gly 🗺️ (Member)' },
  ];

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 relative overflow-hidden bg-slate-950 py-12">
      {/* Background ambient light effects */}
      <div className="absolute top-[-10%] left-[-20%] w-[60%] aspect-square rounded-full bg-violet-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[60%] aspect-square rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-2 animate-bounce">
            <Compass className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white font-display">
            Trip<span className="text-gradient">Split</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            Splitwise for Barkada Travel — collaborative, transparent, realtime.
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-2xl relative">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            {isSignUp ? (
              <>
                <UserPlus className="w-5 h-5 text-primary" /> Create Account
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 text-primary" /> Welcome Back
              </>
            )}
          </h2>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gly"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium rounded-xl py-3 text-sm transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-6"
            >
              {loading ? 'Authenticating...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          {/* Form Toggle */}
          <div className="mt-6 text-center text-xs">
            <span className="text-slate-400">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-primary font-semibold hover:underline bg-transparent border-0 cursor-pointer p-0"
            >
              {isSignUp ? 'Sign In' : 'Register Now'}
            </button>
          </div>
        </div>

        {/* Sandbox Dev Access Card */}
        <div className="glass-panel border-amber-500/20 bg-amber-500/5 rounded-3xl p-6 text-center space-y-4 shadow-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Evaluator Sandbox
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Instant Demo Login</h3>
            <p className="text-xs text-slate-400 mt-1">
              Test multi-user collaborative splits immediately without configuring Supabase.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {demoUsers.map((user) => (
              <button
                key={user.email}
                type="button"
                onClick={() => loginAsSandboxUser(user.name, user.email)}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white text-[11px] font-medium py-2 px-1 rounded-xl transition-all active:scale-95 flex flex-col items-center justify-center gap-1"
              >
                <span>{user.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
