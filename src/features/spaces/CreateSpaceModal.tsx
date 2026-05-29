import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { X, Globe, AlignLeft } from 'lucide-react';

interface CreateSpaceModalProps {
  onClose: () => void;
  onSpaceCreated: (spaceId: string) => void;
}

export function CreateSpaceModal({ onClose, onSpaceCreated }: CreateSpaceModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Trip name is required');
      return await api.createSpace(name, description);
    },
    onSuccess: (spaceId) => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      onSpaceCreated(spaceId);
      onClose();
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to create Travel Space');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    mutation.mutate();
  }

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">

      {/* Tap outside container to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="w-full sm:max-w-md bg-slate-950 sm:rounded-3xl rounded-t-3xl border-t sm:border border-slate-800 p-6 space-y-6 z-10 animate-slide-up shadow-2xl relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Create Travel Space</h2>
            <p className="text-xs text-slate-400">Set up a shared space for expense splitting.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Inputs */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-primary" /> Trip Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Zambales Outing 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-primary" /> Description / Plan
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Barkada road trip to surf! Split gas, food, and Airbnb."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-medium rounded-xl py-3 text-sm transition-all active:scale-95 cursor-pointer text-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl py-3 text-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-primary/10 text-center"
          >
            {mutation.isPending ? 'Creating...' : 'Create Space'}
          </button>
        </div>
      </form>
    </div>
  );
}
