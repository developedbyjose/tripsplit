import { Plus } from 'lucide-react';
import { useAppLayout } from '../hooks/useAppLayout';

// Layout shell components
import { DesktopSidebar } from './layout/DesktopSidebar';
import { DesktopRightPanel } from './layout/DesktopRightPanel';
import { MobileHeader } from './layout/MobileHeader';
import { MobileBottomNav } from './layout/MobileBottomNav';
import { CurrencyProvider } from '../hooks/useCurrencySetting';

// Feature views
import { Dashboard } from '../features/dashboard/Dashboard';
import { ExpenseList } from '../features/expenses/ExpenseList';
import { ExpenseForm } from '../features/expenses/ExpenseForm';
import { SettlementSummary } from '../features/settlements/SettlementSummary';
import { ActivityFeed } from '../features/dashboard/ActivityFeed';
import { SpaceList } from '../features/spaces/SpaceList';
import { SpaceSettingsView } from '../features/spaces/components/SpaceSettingsView';

// Modal views
import { CreateSpaceModal } from '../features/spaces/CreateSpaceModal';
import { JoinSpace } from '../features/spaces/JoinSpace';

/**
 * AppLayout
 *
 * Thin orchestration shell — owns zero raw state or queries.
 * All state and data-fetching is delegated to `useAppLayout`.
 * Each visual region is a focused, single-responsibility component.
 *
 * Structure:
 *   DesktopSidebar | <main content> | DesktopRightPanel
 *   MobileHeader   | <main content> | MobileBottomNav (FAB + tabs)
 */
export function AppLayout() {
  const {
    profile, signOut,
    activeSpaceId, activeTab, setActiveTab,
    space, members, inviteToken,
    showCreateModal, setShowCreateModal,
    showJoinModal, setShowJoinModal,
    showExpenseForm, expenseToEdit,
    copiedInvite,
    handleSelectSpace, handleBackToTrips,
    handleEditExpense, handleAddExpense, handleCloseExpenseForm,
    copyInviteLink,
  } = useAppLayout();

  function renderTabContent() {
    if (!activeSpaceId) return null;
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard spaceId={activeSpaceId} />;
      case 'expenses':
        return <ExpenseList spaceId={activeSpaceId} onEditExpense={handleEditExpense} />;
      case 'settlements':
        return <SettlementSummary spaceId={activeSpaceId} />;
      case 'activity':
        return <ActivityFeed spaceId={activeSpaceId} />;
      case 'settings':
        return (
          <SpaceSettingsView
            members={members}
            inviteToken={inviteToken}
            copiedInvite={copiedInvite}
            onCopyInvite={copyInviteLink}
          />
        );
      default:
        return null;
    }
  }

  return (
    <CurrencyProvider spaceId={activeSpaceId}>
      <div className="min-h-screen bg-slate-950 flex flex-col relative text-white w-full">
        {/* Ambient background blobs */}
        <div className="absolute top-[-10%] left-[-20%] w-[50%] aspect-square rounded-full bg-violet-900/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[50%] aspect-square rounded-full bg-indigo-900/10 blur-[100px] pointer-events-none" />

        <div className="mobile-container glass-panel shadow-2xl overflow-hidden flex flex-col lg:flex-row justify-between flex-1 border-x lg:border-none border-slate-900">

          {/* ── Desktop left sidebar ────────────────────────── */}
          <DesktopSidebar
            profile={profile}
            space={space}
            activeSpaceId={activeSpaceId}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onBackToTrips={handleBackToTrips}
            onSignOut={signOut}
          />

          {/* ── Mobile sticky header ────────────────────────── */}
          <MobileHeader
            profile={profile}
            activeSpaceId={activeSpaceId}
            spaceName={space?.name}
            activeTab={activeTab}
            onBackToTrips={handleBackToTrips}
            onTabChange={setActiveTab}
            onSignOut={signOut}
          />

          {/* ── Center content area ─────────────────────────── */}
          <main className="flex-1 overflow-y-auto px-4 py-5 pb-24 lg:pb-5 lg:px-8 lg:py-8 flex flex-col min-w-0">
            {activeSpaceId ? (
              <div className="flex-1 space-y-6">
                {/* Desktop trip header with quick-add button */}
                <div className="hidden lg:flex items-center justify-between border-b border-slate-900/60 pb-5">
                  <div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">
                      {space?.name}
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                      {space?.description || 'No description available.'}
                    </p>
                  </div>
                  <button
                    onClick={handleAddExpense}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-primary/20 transition-all active:scale-95 cursor-pointer border border-primary/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log Expense</span>
                  </button>
                </div>

                <div className="flex-1">{renderTabContent()}</div>
              </div>
            ) : (
              <SpaceList
                onSelectSpace={handleSelectSpace}
                onCreateClick={() => setShowCreateModal(true)}
                onJoinClick={() => setShowJoinModal(true)}
              />
            )}
          </main>

          {/* ── Desktop right panel (only when space is active) ── */}
          {activeSpaceId && space && (
            <DesktopRightPanel
              members={members}
              inviteToken={inviteToken}
              copiedInvite={copiedInvite}
              onCopyInvite={copyInviteLink}
            />
          )}

          {/* ── Mobile FAB + bottom tab bar ─────────────────── */}
          {activeSpaceId && (
            <MobileBottomNav
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onAddExpense={handleAddExpense}
            />
          )}

          {/* ── Modals ──────────────────────────────────────── */}
          {showCreateModal && (
            <CreateSpaceModal
              onClose={() => setShowCreateModal(false)}
              onSpaceCreated={handleSelectSpace}
            />
          )}
          {showJoinModal && (
            <JoinSpace
              onClose={() => setShowJoinModal(false)}
              onSpaceJoined={handleSelectSpace}
            />
          )}
          {showExpenseForm && activeSpaceId && (
            <ExpenseForm
              spaceId={activeSpaceId}
              expenseToEdit={expenseToEdit}
              onClose={handleCloseExpenseForm}
            />
          )}
        </div>
      </div>
    </CurrencyProvider>
  );
}
