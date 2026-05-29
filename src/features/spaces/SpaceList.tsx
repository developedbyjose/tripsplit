import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Plus, UserPlus, Compass, ArrowRight, Calendar } from 'lucide-react';

interface SpaceListProps {
  onSelectSpace: (spaceId: string) => void;
  onCreateClick: () => void;
  onJoinClick: () => void;
}

export function SpaceList({ onSelectSpace, onCreateClick, onJoinClick }: SpaceListProps) {
  const { data: spaces, isLoading, error } = useQuery({
    queryKey: ['spaces'],
    queryFn: api.getSpaces,
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-20 space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading travel spaces...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-20 px-6 text-center space-y-4">
        <p className="text-red-400 text-sm">Failed to load spaces: {(error as any).message}</p>
        <button
          onClick={onCreateClick}
          className="bg-primary px-4 py-2 rounded-xl text-white text-xs font-semibold"
        >
          Create New Space
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Your Trips</h1>
          <p className="text-xs text-slate-400">Select or create a Travel Space to begin.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onJoinClick}
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-primary" /> Join Trip
          </button>
          <button
            onClick={onCreateClick}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary/95 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-primary/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Trip
          </button>
        </div>
      </div>

      {/* Grid List */}
      {!spaces || spaces.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center items-center py-20 glass-panel rounded-3xl border-dashed border-2 border-slate-800 p-8 text-center space-y-5">
          <div className="p-4 rounded-2xl bg-slate-900 text-slate-500">
            <Compass className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-white font-bold text-lg">No Travel Spaces Yet</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Create a shared space for your barkada, invite your friends, and start splitting expenses automatically.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCreateClick}
              className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition-all active:scale-95 shadow-md shadow-primary/10"
            >
              Create a Space
            </button>
            <button
              onClick={onJoinClick}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition-all active:scale-95"
            >
              Join with QR Code
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => (
            <div
              key={space.id}
              onClick={() => onSelectSpace(space.id)}
              className="group glass-panel rounded-2xl p-5 hover:border-primary/40 hover:bg-slate-900/30 transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between h-[160px] active:scale-[0.98]"
            >
              {/* Card BG light highlight */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-all pointer-events-none" />

              <div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-white font-bold text-base leading-tight group-hover:text-primary transition-colors line-clamp-1">
                    {space.name}
                  </h3>
                  <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 capitalize">
                    {space.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {space.description || 'No description available.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-900/60 mt-auto">
                <div className="flex items-center gap-1 text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[10px]">
                    {new Date(space.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
                  <span>Enter</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
