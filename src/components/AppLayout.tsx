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
  Users,
  Settings
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
    enabled: !!activeSpaceId,
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
      <div className="mobile-container glass-panel shadow-2xl overflow-hidden flex flex-col lg:flex-row justify-between flex-1 border-x lg:border-none border-slate-900">
        
        {/* ========================================================
            DESKTOP LEFT SIDEBAR (hidden lg:flex)
           ======================================================== */}
        <aside className="hidden lg:flex flex-col w-[280px] bg-slate-950/80 border-r border-slate-900/80 p-5 shrink-0 z-30 justify-between">
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">TripSplit</h1>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Travel Budgeting</p>
              </div>
            </div>

            {activeSpaceId && space ? (
              <div className="space-y-4">
                {/* Active Trip Header */}
                <div className="p-3 bg-slate-900/40 border border-slate-800/60 rounded-xl space-y-1.5">
                  <span className="text-[9px] font-bold text-primary uppercase tracking-wider">Active Trip</span>
                  <h3 className="text-white text-sm font-bold truncate">{space.name}</h3>
                  <button
                    onClick={() => {
                      setActiveSpaceId(null);
                      setExpenseToEdit(null);
                    }}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors mt-2 cursor-pointer font-medium"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Trips</span>
                  </button>
                </div>

                {/* Sidebar Navigation Links */}
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                      activeTab === 'dashboard'
                        ? 'bg-primary text-white'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 shrink-0" />
                    <span>Overview</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('expenses')}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                      activeTab === 'expenses'
                        ? 'bg-primary text-white'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <Receipt className="w-4 h-4 shrink-0" />
                    <span>Expenses</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('settlements')}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                      activeTab === 'settlements'
                        ? 'bg-primary text-white'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>Settle Up</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                      activeTab === 'activity'
                        ? 'bg-primary text-white'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <Activity className="w-4 h-4 shrink-0" />
                    <span>Activity Feed</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                      activeTab === 'settings'
                        ? 'bg-primary text-white'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <Settings className="w-4 h-4 shrink-0" />
                    <span>Trip Settings</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-900/20 border border-slate-900 rounded-xl text-center space-y-2 py-4">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">No Selected Trip</span>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Select a shared travel space from the main panel to begin tracking.
                </p>
              </div>
            )}
          </div>

          {/* User profile & signout at the bottom */}
          <div className="border-t border-slate-900/80 pt-4 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <img
                src={profile?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${profile?.id}`}
                alt=""
                className="w-8 h-8 rounded-full border border-slate-800 shrink-0"
              />
              <div className="overflow-hidden">
                <h4 className="text-white text-xs font-bold truncate">{profile?.name || 'Explorer'}</h4>
                <p className="text-[9px] text-slate-500 truncate">{profile?.email}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-red-400 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* ========================================================
            MOBILE VIEW ONLY: Header Navigation
           ======================================================== */}
        <header className="lg:hidden px-4 py-3.5 border-b border-slate-900/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
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
            {activeSpaceId && (
              <button
                onClick={() => setActiveTab(activeTab === 'settings' ? 'dashboard' : 'settings')}
                className={`p-1.5 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'settings' ? 'text-primary' : 'text-slate-400 hover:text-white'
                }`}
                title="Trip Settings"
              >
                <Settings className="w-4.5 h-4.5" />
              </button>
            )}
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

        {/* ========================================================
            CENTER HUB CONTENT AREA
           ======================================================== */}
        <main className="flex-1 overflow-y-auto px-4 py-5 pb-24 lg:pb-5 lg:px-8 lg:py-8 flex flex-col min-w-0">
          {activeSpaceId ? (
            <div className="flex-1 space-y-6">
              {/* Desktop trip-header */}
              <div className="hidden lg:flex items-center justify-between border-b border-slate-900/60 pb-5">
                <div>
                  <h1 className="text-2xl font-extrabold text-white tracking-tight">{space?.name}</h1>
                  <p className="text-xs text-slate-400 mt-1">{space?.description || 'No description available.'}</p>
                </div>
                
                {/* Desktop quick add expense button */}
                <button
                  onClick={() => {
                    setExpenseToEdit(null);
                    setShowExpenseForm(true);
                  }}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-primary/20 transition-all active:scale-95 cursor-pointer border border-primary/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Expense</span>
                </button>
              </div>
              
              <div className="flex-1">
                {renderTabContent()}
              </div>
            </div>
          ) : (
            <SpaceList
              onSelectSpace={handleSelectSpace}
              onCreateClick={() => setShowCreateModal(true)}
              onJoinClick={() => setShowJoinModal(true)}
            />
          )}
        </main>

        {/* ========================================================
            DESKTOP RIGHT SIDEBAR (hidden lg:flex)
           ======================================================== */}
        {activeSpaceId && space && (
          <aside className="hidden lg:flex flex-col w-[320px] bg-slate-950/80 border-l border-slate-900/80 p-5 shrink-0 z-30 space-y-6 overflow-y-auto">
            {/* Quick members summary */}
            <div className="glass-panel rounded-2xl p-4 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" /> Active Members ({members.length})
              </h3>
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
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

            {/* Quick Invite Box */}
            <div className="glass-panel rounded-2xl p-5 text-center flex flex-col items-center space-y-4">
              <div className="inline-flex p-2 rounded-xl bg-primary/10 text-primary">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Invite Travel Buddy</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Friends can join this travel space instantly by scanning this QR code.
                </p>
              </div>

              {inviteToken ? (
                <div className="bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center">
                  <QRCodeSVG value={inviteToken} size={140} level="M" />
                </div>
              ) : (
                <div className="w-[140px] h-[140px] bg-slate-900 animate-pulse rounded-2xl" />
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
          </aside>
        )}

        {/* ========================================================
            MOBILE VIEW ONLY: FAB + Bottom tab navigator
           ======================================================== */}
        {activeSpaceId && (
          <div className="lg:hidden">
            {/* FAB Button */}
            <div className="absolute bottom-18 left-1/2 -translate-x-1/2 z-40">
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
            <nav className="absolute bottom-0 left-0 right-0 border-t border-slate-900/80 bg-slate-950/80 backdrop-blur-lg z-30 grid grid-cols-5 w-full">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 overflow-hidden transition-all ${
                  activeTab === 'dashboard' ? 'text-primary' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <LayoutDashboard className="w-5 h-5 shrink-0" />
                <span className="text-[8px] font-bold uppercase tracking-wider w-full text-center truncate px-1">Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('expenses')}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 overflow-hidden transition-all ${
                  activeTab === 'expenses' ? 'text-primary' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Receipt className="w-5 h-5 shrink-0" />
                <span className="text-[8px] font-bold uppercase tracking-wider w-full text-center truncate px-1">Expenses</span>
              </button>

              {/* FAB spacer — exactly 1/5 cell in the grid */}
              <div />

              <button
                onClick={() => setActiveTab('settlements')}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 overflow-hidden transition-all ${
                  activeTab === 'settlements' ? 'text-primary' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span className="text-[8px] font-bold uppercase tracking-wider w-full text-center truncate px-1">Settle</span>
              </button>

              <button
                onClick={() => setActiveTab('activity')}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 overflow-hidden transition-all ${
                  activeTab === 'activity' ? 'text-primary' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Activity className="w-5 h-5 shrink-0" />
                <span className="text-[8px] font-bold uppercase tracking-wider w-full text-center truncate px-1">Activity</span>
              </button>
            </nav>
          </div>
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
