import { Compass, LayoutDashboard, Receipt, CheckCircle, Activity, Settings, ArrowLeft, LogOut } from 'lucide-react';
import type { ActiveTab } from '../../hooks/useAppLayout';
import type { Space } from '../../services/api';

interface Profile {
  id?: string;
  name?: string;
  email?: string;
  avatar_url?: string;
}

interface DesktopSidebarProps {
  profile: Profile | null;
  space: Space | null | undefined;
  activeSpaceId: string | null;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onBackToTrips: () => void;
  onSignOut: () => void;
}

const NAV_ITEMS: { tab: ActiveTab; icon: React.ElementType; label: string }[] = [
  { tab: 'dashboard',    icon: LayoutDashboard, label: 'Overview'      },
  { tab: 'expenses',     icon: Receipt,         label: 'Expenses'      },
  { tab: 'settlements',  icon: CheckCircle,     label: 'Settle Up'     },
  { tab: 'activity',     icon: Activity,        label: 'Activity Feed' },
  { tab: 'settings',     icon: Settings,        label: 'Trip Settings' },
];

/**
 * DesktopSidebar
 *
 * Left-hand navigation sidebar shown only on lg+ screens.
 * Renders the brand header, active trip card, nav links,
 * and the user profile / sign-out footer.
 */
export function DesktopSidebar({
  profile,
  space,
  activeSpaceId,
  activeTab,
  onTabChange,
  onBackToTrips,
  onSignOut,
}: DesktopSidebarProps) {
  const avatarSrc =
    profile?.avatar_url ||
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${profile?.id}`;

  return (
    <aside className="hidden lg:flex flex-col w-[280px] bg-slate-950/80 border-r border-slate-900/80 p-5 shrink-0 z-30 justify-between">
      <div className="space-y-6">
        {/* Brand header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">TripSplit</h1>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              Travel Budgeting
            </p>
          </div>
        </div>

        {/* Active space block or empty state */}
        {activeSpaceId && space ? (
          <div className="space-y-4">
            <div className="p-3 bg-slate-900/40 border border-slate-800/60 rounded-xl space-y-1.5">
              <span className="text-[9px] font-bold text-primary uppercase tracking-wider">
                Active Trip
              </span>
              <h3 className="text-white text-sm font-bold truncate">{space.name}</h3>
              <button
                onClick={onBackToTrips}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors mt-2 cursor-pointer font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Trips</span>
              </button>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1">
              {NAV_ITEMS.map(({ tab, icon: Icon, label }) => (
                <button
                  key={tab}
                  onClick={() => onTabChange(tab)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-primary text-white'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
        ) : (
          <div className="p-3 bg-slate-900/20 border border-slate-900 rounded-xl text-center space-y-2 py-4">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
              No Selected Trip
            </span>
            <p className="text-[10px] text-slate-400 leading-normal">
              Select a shared travel space from the main panel to begin tracking.
            </p>
          </div>
        )}
      </div>

      {/* User profile + sign-out footer */}
      <div className="border-t border-slate-900/80 pt-4 space-y-3.5">
        <div className="flex items-center gap-2.5">
          <img
            src={avatarSrc}
            alt={profile?.name || 'User avatar'}
            className="w-8 h-8 rounded-full border border-slate-800 shrink-0"
          />
          <div className="overflow-hidden">
            <h4 className="text-white text-xs font-bold truncate">
              {profile?.name || 'Explorer'}
            </h4>
            <p className="text-[9px] text-slate-500 truncate">{profile?.email}</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-red-400 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
