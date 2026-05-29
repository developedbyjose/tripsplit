import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Expense } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { Dashboard } from '../features/dashboard/Dashboard';
import { ExpenseList } from '../features/expenses/ExpenseList';
import { ExpenseForm } from '../features/expenses/ExpenseForm';
import { SettlementSummary } from '../features/settlements/SettlementSummary';
import { ActivityFeed } from '../features/dashboard/ActivityFeed';
import { SpaceList } from '../features/spaces/SpaceList';
import { CreateSpaceModal } from '../features/spaces/CreateSpaceModal';
import { JoinSpace } from '../features/spaces/JoinSpace';
import { QRCodeSVG } from 'qrcode.react';
import {
  Compass,
  LayoutDashboard,
  Receipt,
  CheckCircle,
  Activity,
  Plus,
  ArrowLeft,
  LogOut,
  QrCode,
  Copy,
  Users
} from 'lucide-react';


export function AppLayout() {
  const { profile, signOut } = useAuth();
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'settlements' | 'activity' | 'settings'>('dashboard');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Hook up realtime sync for active space
  useRealtimeSync(activeSpaceId);

  // Query space details
  const { data: space } = useQuery({
    queryKey: ['space', activeSpaceId],
    queryFn: () => api.getSpace(activeSpaceId!),
    enabled: !!activeSpaceId,
  });

  // Query member lists for settings
  const { data: members = [] } = useQuery({
    queryKey: ['members', activeSpaceId],
    queryFn: () => api.getMembers(activeSpaceId!),
    enabled: !!activeSpaceId,
  });

  // Query invite token
  const { data: inviteToken } = useQuery({
    queryKey: ['invite-token', activeSpaceId],
    queryFn: () => api.getOrGenerateInvite(activeSpaceId!),
    enabled: !!activeSpaceId && activeTab === 'settings',
  });

  function handleSelectSpace(spaceId: string) {
    setActiveSpaceId(spaceId);
    setActiveTab('dashboard');
  }

  function handleEditExpense(expense: Expense) {
    setExpenseToEdit(expense);
    setShowExpenseForm(true);
  }

  function copyInviteLink() {
    if (!inviteToken) return;
    navigator.clipboard.writeText(inviteToken);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  }

  // Renders the main dashboard/view based on selected tab
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
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Trip Settings</h2>
              <p className="text-xs text-slate-400 font-medium">Manage members and invite others.</p>
            </div>

            {/* Invite QR Box */}
            <div className="glass-panel rounded-2xl p-5 text-center flex flex-col items-center space-y-4">
              <div className="inline-flex p-2 rounded-xl bg-primary/10 text-primary">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Invite Travel Buddy</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Let friends join this travel space instantly by scanning this QR code.
                </p>
              </div>

              {inviteToken ? (
                <div className="bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center">
                  <QRCodeSVG value={inviteToken} size={130} level="M" />
                </div>
              ) : (
                <div className="w-[130px] h-[130px] bg-slate-900 animate-pulse rounded-2xl" />
              )}

              <div className="flex gap-2 w-full pt-1.5">
                <div className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 text-xs px-3.5 py-2.5 rounded-xl truncate text-left font-mono">
                  {inviteToken || 'Loading...'}
                </div>
                <button
                  onClick={copyInviteLink}
                  className="bg-primary hover:bg-primary/90 text-white p-2.5 rounded-xl text-xs font-semibold cursor-pointer shrink-0 flex items-center gap-1 transition-all active:scale-95"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedInvite ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Space Members */}
            <div className="glass-panel rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" /> Active Members ({members.length})
              </h3>
              <div className="space-y-3 pt-1">
                {members.map((m) => (
                  <div key={m.user_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={m.user?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${m.user_id}`}
                        alt=""
                        className="w-7 h-7 rounded-full border border-slate-800"
                      />
                      <div>
                        <h4 className="text-white text-xs font-bold">{m.user?.name}</h4>
                        <p className="text-[9px] text-slate-500">{m.user?.email}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-semibold text-primary uppercase tracking-wider bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative text-white w-full">
      {/* Background visual shapes */}
      <div className="absolute top-[-10%] left-[-20%] w-[50%] aspect-square rounded-full bg-violet-900/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[50%] aspect-square rounded-full bg-indigo-900/10 blur-[100px] pointer-events-none" />

      {/* Main viewport boundaries */}
      <div className="mobile-container glass-panel shadow-2xl overflow-hidden flex flex-col justify-between flex-1 border-x border-slate-900">
        
        {/* Header Navigation */}
        <header className="px-4 py-3.5 border-b border-slate-900/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {activeSpaceId ? (
              <button
                onClick={() => {
                  setActiveSpaceId(null);
                  setExpenseToEdit(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
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
                {activeSpaceId ? space?.name : 'TripSplit'}
              </h1>
              <p className="text-[9px] text-slate-500 font-medium leading-none mt-0.5">
                {activeSpaceId ? 'Trip Dashboard' : `Hello, ${profile?.name || 'Explorer'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <img
              src={profile?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${profile?.id}`}
              alt=""
              className="w-7 h-7 rounded-full border border-slate-800 shrink-0"
            />
            <button
              onClick={signOut}
              className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto px-4 py-5 pb-24">
          {activeSpaceId ? (
            renderTabContent()
          ) : (
            <SpaceList
              onSelectSpace={handleSelectSpace}
              onCreateClick={() => setShowCreateModal(true)}
              onJoinClick={() => setShowJoinModal(true)}
            />
          )}
        </main>

        {/* FAB + Bottom tab navigator for active space */}
        {activeSpaceId && (
          <>
            {/* FAB Button */}
            <div className="fixed bottom-18 left-1/2 -translate-x-1/2 z-40">
              <button
                onClick={() => {
                  setExpenseToEdit(null);
                  setShowExpenseForm(true);
                }}
                className="bg-primary hover:bg-primary/95 text-white p-4 rounded-full shadow-xl shadow-primary/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border border-primary/20"
                title="Add Expense"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <nav className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto border-t border-slate-900/80 bg-slate-950/80 backdrop-blur-lg px-4 py-2.5 z-30 grid grid-cols-5 gap-1 text-center">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'dashboard' ? 'text-primary scale-102' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-[8px] font-bold uppercase tracking-wider">Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('expenses')}
                className={`flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'expenses' ? 'text-primary scale-102' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Receipt className="w-5 h-5" />
                <span className="text-[8px] font-bold uppercase tracking-wider">Expenses</span>
              </button>

              <div className="w-10 h-10 shrink-0" /* Empty spacer for FAB alignment */ />

              <button
                onClick={() => setActiveTab('settlements')}
                className={`flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'settlements' ? 'text-primary scale-102' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                <span className="text-[8px] font-bold uppercase tracking-wider">Settle</span>
              </button>

              <button
                onClick={() => setActiveTab('activity')}
                className={`flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'activity' ? 'text-primary scale-102' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Activity className="w-5 h-5" />
                <span className="text-[8px] font-bold uppercase tracking-wider">Activity</span>
              </button>
            </nav>
          </>
        )}

        {/* Modal mounts */}
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
            onClose={() => {
              setShowExpenseForm(false);
              setExpenseToEdit(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
