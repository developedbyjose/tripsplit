import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Expense } from '../services/api';
import { useAuth } from './useAuth';
import { useRealtimeSync } from './useRealtimeSync';

export type ActiveTab = 'dashboard' | 'expenses' | 'settlements' | 'activity' | 'settings';

/**
 * useAppLayout
 *
 * Central state hook for the main application shell.
 * Owns all top-level layout state (active space, active tab, modal visibility)
 * and the queries needed for the sidebar / settings panels.
 *
 * Keeps AppLayout.tsx a pure, thin presentation shell.
 */
export function useAppLayout() {
  const { profile, signOut } = useAuth();

  // --- Navigation state ---
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // --- Modal visibility ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  // --- Clipboard feedback ---
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Subscribe to realtime updates for the active space
  useRealtimeSync(activeSpaceId);

  // --- Server data queries ---
  const { data: space } = useQuery({
    queryKey: ['space', activeSpaceId],
    queryFn: () => api.getSpace(activeSpaceId!),
    enabled: !!activeSpaceId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members', activeSpaceId],
    queryFn: () => api.getMembers(activeSpaceId!),
    enabled: !!activeSpaceId,
  });

  const { data: inviteToken } = useQuery({
    queryKey: ['invite-token', activeSpaceId],
    queryFn: () => api.getOrGenerateInvite(activeSpaceId!),
    enabled: !!activeSpaceId,
  });

  // --- Event handlers ---
  function handleSelectSpace(spaceId: string) {
    setActiveSpaceId(spaceId);
    setActiveTab('dashboard');
  }

  function handleBackToTrips() {
    setActiveSpaceId(null);
    setExpenseToEdit(null);
  }

  function handleEditExpense(expense: Expense) {
    setExpenseToEdit(expense);
    setShowExpenseForm(true);
  }

  function handleAddExpense() {
    setExpenseToEdit(null);
    setShowExpenseForm(true);
  }

  function handleCloseExpenseForm() {
    setShowExpenseForm(false);
    setExpenseToEdit(null);
  }

  function copyInviteLink() {
    if (!inviteToken) return;
    navigator.clipboard.writeText(inviteToken);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  }

  return {
    // Auth
    profile,
    signOut,
    // Navigation
    activeSpaceId,
    activeTab,
    setActiveTab,
    // Space data
    space,
    members,
    inviteToken,
    // Modal flags
    showCreateModal,
    setShowCreateModal,
    showJoinModal,
    setShowJoinModal,
    showExpenseForm,
    expenseToEdit,
    // Clipboard
    copiedInvite,
    // Handlers
    handleSelectSpace,
    handleBackToTrips,
    handleEditExpense,
    handleAddExpense,
    handleCloseExpenseForm,
    copyInviteLink,
  };
}
