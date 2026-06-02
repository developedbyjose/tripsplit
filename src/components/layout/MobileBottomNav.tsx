import { LayoutDashboard, Receipt, CheckCircle, Activity, Plus } from 'lucide-react';
import type { ActiveTab } from '../../hooks/useAppLayout';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onAddExpense: () => void;
}

// Data-driven nav items. `null` marks the center FAB placeholder slot.
type NavItem = { tab: ActiveTab; icon: React.ElementType; label: string } | null;

const NAV_ITEMS: NavItem[] = [
  { tab: 'dashboard',   icon: LayoutDashboard, label: 'Overview'  },
  { tab: 'expenses',    icon: Receipt,         label: 'Expenses'  },
  null, // FAB spacer — center cell in the 5-column grid
  { tab: 'settlements', icon: CheckCircle,     label: 'Settle'    },
  { tab: 'activity',    icon: Activity,        label: 'Activity'  },
];

/**
 * MobileBottomNav
 *
 * Fixed bottom navigation bar and floating action button (FAB)
 * rendered only on mobile (hidden on lg+).
 *
 * Uses a 5-column grid: 2 tabs | FAB gap | 2 tabs.
 * The FAB is positioned absolutely above the center cell.
 */
export function MobileBottomNav({
  activeTab,
  onTabChange,
  onAddExpense,
}: MobileBottomNavProps) {
  return (
    <div className="lg:hidden">
      {/* Floating Action Button */}
      <div className="absolute bottom-18 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={onAddExpense}
          className="bg-primary hover:bg-primary/95 text-white p-4 rounded-full shadow-xl shadow-primary/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border border-primary/20"
          aria-label="Add expense"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom tab bar */}
      <nav className="absolute bottom-0 left-0 right-0 border-t border-slate-900/80 bg-slate-950/80 backdrop-blur-lg z-30 grid grid-cols-5 w-full">
        {NAV_ITEMS.map((item, idx) =>
          item === null ? (
            // Empty cell reserved for the FAB visual gap
            <div key={`fab-gap-${idx}`} aria-hidden="true" />
          ) : (
            <button
              key={item.tab}
              onClick={() => onTabChange(item.tab)}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 overflow-hidden transition-all ${
                activeTab === item.tab
                  ? 'text-primary'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              aria-label={item.label}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="text-[8px] font-bold uppercase tracking-wider w-full text-center truncate px-1">
                {item.label}
              </span>
            </button>
          )
        )}
      </nav>
    </div>
  );
}
