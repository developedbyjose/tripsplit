import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { X, QrCode, Ticket, ArrowRight, CheckCircle2 } from 'lucide-react';

interface JoinSpaceProps {
  onClose: () => void;
  onSpaceJoined: (spaceId: string) => void;
}

export function JoinSpace({ onClose, onSpaceJoined }: JoinSpaceProps) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const mutation = useMutation({
    mutationFn: async (inviteToken: string) => {
      if (!inviteToken.trim()) throw new Error('Invite code is required');
      return await api.joinSpace(inviteToken.trim());
    },
    onSuccess: (spaceId) => {
      setSuccessMsg('Successfully joined the Travel Space!');
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      setTimeout(() => {
        onSpaceJoined(spaceId);
        onClose();
      }, 1200);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to join space. Please check the code.');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    mutation.mutate(token);
  }

  // Pre-configured Sandbox scan token to test QR flow instantly
  const sandboxTokens = [
    { label: 'Zambales 2026 Code', value: 'zambales2026' }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Tap outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Form Card */}
      <div className="w-full sm:max-w-md bg-slate-950 sm:rounded-3xl rounded-t-3xl border-t sm:border border-slate-800 p-6 space-y-6 z-10 animate-slide-up shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" /> Join Travel Space
            </h2>
            <p className="text-xs text-slate-400">Scan QR or enter the invite code shared with you.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg ? (
          <div className="py-8 flex flex-col justify-center items-center text-center space-y-3">
            <div className="p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-scale-up">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <p className="text-sm font-semibold text-white">{successMsg}</p>
            <p className="text-xs text-slate-400">Redirecting to trip dashboard...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded-xl">
                {error}
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5 text-primary" /> Invite Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter code (e.g. zambales2026)"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="bg-primary hover:bg-primary/90 text-white p-3 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </form>

            {/* Simulating QR Scan option */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-primary" /> Scan Simulation
              </h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Click a code below to simulate scanning a Travel Space QR invite card:
              </p>
              <div className="flex flex-wrap gap-2">
                {sandboxTokens.map((st) => (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => {
                      setToken(st.value);
                      mutation.mutate(st.value);
                    }}
                    className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] text-primary hover:text-white font-bold py-2 px-3.5 rounded-xl transition-all active:scale-95"
                  >
                    Scan "{st.label}"
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
