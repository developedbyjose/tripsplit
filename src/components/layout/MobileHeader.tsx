import { Compass, ArrowLeft, Settings, LogOut } from 'lucide-react';
import type { ActiveTab } from '../../hooks/useAppLayout';

interface Profile {
  id?: string;
  name?: string;
  avatar_url?: string;
}

interface MobileHeaderProps {
  profile: Profile | null;
  activeSpaceId: string | null;
  spaceName?: string;
  activeTab: ActiveTab;
  onBackToTrips: () => void;
  onTabChange: (tab: ActiveTab) => void;
  onSignOut: () => void;
}

/**
 * MobileHeader
 *
 * Sticky top header rendered only on mobile (hidden on lg+).
 * Shows the brand logo or a back arrow, the current trip/app title,
 * and quick-access settings + sign-out icon buttons.
 */
export function MobileHeader({
  profile,
  activeSpaceId,
  spaceName,
  activeTab,
  onBackToTrips,
  onTabChange,
  onSignOut,
}: MobileHeaderProps) {
  const avatarSrc =
    profile?.avatar_url ||
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${profile?.id}`;

  const isSettings = activeTab === 'settings';

  return (
    <header className="lg:hidden px-4 py-3.5 border-b border-slate-900/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
      {/* Left: back button or brand icon */}
      <div className="flex items-center gap-2.5">
        {activeSpaceId ? (
          <button
            onClick={onBackToTrips}
            className="p-1 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Back to trips"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="p-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <Compass className="w-5 h-5" />
          </div>
        )}

        <div>
          <h1 className="text-base font-bold text-white tracking-tight">
            {activeSpaceId ? spaceName : 'TripSplit'}
          </h1>
          <p className="text-[9px] text-slate-500 font-medium leading-none mt-0.5">
            {activeSpaceId
              ? 'Trip Dashboard'
              : `Hello, ${profile?.name || 'Explorer'}`}
          </p>
        </div>
      </div>

      {/* Right: settings toggle, avatar, sign-out */}
      <div className="flex items-center gap-1.5">
        {activeSpaceId && (
          <button
            onClick={() => onTabChange(isSettings ? 'dashboard' : 'settings')}
            className={`p-1.5 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer shrink-0 ${
              isSettings ? 'text-primary' : 'text-slate-400 hover:text-white'
            }`}
            aria-label="Trip settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}

        <img
          src={avatarSrc}
          alt={profile?.name || 'User avatar'}
          className="w-7 h-7 rounded-full border border-slate-800 shrink-0"
        />

        <button
          onClick={onSignOut}
          className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
          aria-label="Log out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
