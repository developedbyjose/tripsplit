import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { Expense } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Trash2, Edit3, History } from 'lucide-react';

interface ExpenseListProps {
  spaceId: string;
  onEditExpense: (expense: Expense) => void;
}

export function ExpenseList({ spaceId, onEditExpense }: ExpenseListProps) {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [selectedExpenseForHistory, setSelectedExpenseForHistory] = useState<string | null>(null);

  const { data: members = [] } = useQuery({
    queryKey: ['members', spaceId],
    queryFn: () => api.getMembers(spaceId),
  });

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', spaceId],
    queryFn: () => api.getExpenses(spaceId),
  });

  const { data: history = [] } = useQuery({
    queryKey: ['expense-history', selectedExpenseForHistory],
    queryFn: () => api.getExpenseHistory(selectedExpenseForHistory!),
    enabled: !!selectedExpenseForHistory,
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', spaceId] });
      queryClient.invalidateQueries({ queryKey: ['settlements', spaceId] });
      queryClient.invalidateQueries({ queryKey: ['space-activity', spaceId] });
    },
  });

  const getMemberName = (userId: string) => {
    const member = members.find((m) => m.user_id === userId);
    return member?.user?.name || 'Someone';
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'food':
        return '🍔';
      case 'lodging':
        return '🏨';
      case 'transport':
        return '🚗';
      case 'activities':
        return '🎫';
      default:
        return '💰';
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 flex flex-col justify-center items-center gap-3">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Loading expense list...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white tracking-tight">Expenses</h2>
        <span className="text-[10px] text-slate-400 font-medium">
          Total: {expenses.length} record{expenses.length === 1 ? '' : 's'}
        </span>
      </div>

      {expenses.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-center space-y-3">
          <p className="text-slate-400 text-xs leading-normal">
            No expenses registered yet in this trip.
          </p>
          <p className="text-[10px] text-slate-500">
            Tap the floating action button (+) below to log your first payment!
          </p>
        </div>
      ) : (
        <>
          {/* Mobile View (Card List) */}
          <div className="lg:hidden space-y-3">
            {expenses.map((expense) => {
              const payerName = getMemberName(expense.paid_by);
              const userRole = members.find((m) => m.user_id === profile?.id)?.role;
              const canManage =
                profile?.id === expense.created_by ||
                userRole === 'owner' ||
                userRole === 'admin';

              return (
                <div
                  key={expense.id}
                  className="glass-panel rounded-2xl p-4 space-y-3 hover:border-slate-800 transition-all"
                >
                  {/* Header info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2 rounded-xl bg-slate-900 border border-slate-800">
                        {getCategoryIcon(expense.category)}
                      </span>
                      <div>
                        <h4 className="text-white text-sm font-semibold">{expense.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Paid by <span className="font-semibold text-slate-300">{payerName}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-extrabold text-sm">
                        ₱{expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                        {expense.category}
                      </p>
                    </div>
                  </div>

                  {/* Split Details & Controls */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-900/60 text-[10px]">
                    <div className="text-slate-400">
                      Split with{' '}
                      <span className="font-semibold text-slate-300">
                        {expense.participants?.length || 0} people
                      </span>{' '}
                      ({expense.participants ? `₱${(expense.amount / expense.participants.length).toFixed(0)} each` : ''})
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedExpenseForHistory(
                            selectedExpenseForHistory === expense.id ? null : expense.id
                          )
                        }
                        className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                        title="View Edit History"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                      {canManage && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEditExpense(expense)}
                            className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                            title="Edit Expense"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Delete this expense?')) {
                                deleteMutation.mutate(expense.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expandable audit log history feed */}
                  {selectedExpenseForHistory === expense.id && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-slate-900 space-y-2 animate-slide-down">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-900/60">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <History className="w-3 h-3 text-primary" /> Expense History Log
                        </span>
                        <button
                          onClick={() => setSelectedExpenseForHistory(null)}
                          className="text-[9px] text-slate-500 hover:text-white"
                        >
                          Hide
                        </button>
                      </div>

                      {history.length === 0 ? (
                        <p className="text-[9px] text-slate-500 py-1">No logs found.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                          {history.map((h) => (
                            <div key={h.id} className="text-[9.5px] leading-relaxed text-slate-400">
                              <span className="text-slate-300 font-medium">{h.editor_name}</span>{' '}
                              {h.field_name === 'created' ? (
                                <span>created this expense.</span>
                              ) : (
                                <span>
                                  changed{' '}
                                  <span className="font-semibold text-slate-300">{h.field_name}</span>{' '}
                                  from <span className="line-through text-red-500/80">{h.old_value || 'none'}</span>{' '}
                                  to <span className="text-emerald-400 font-semibold">{h.new_value}</span>
                                </span>
                              )}
                              <span className="text-[8px] text-slate-500 block">
                                {new Date(h.edited_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block glass-panel rounded-2xl overflow-hidden border border-slate-900">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-950/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Details</th>
                  <th className="py-3.5 px-4">Paid By</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Split Share</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {expenses.map((expense) => {
                  const payerName = getMemberName(expense.paid_by);
                  const userRole = members.find((m) => m.user_id === profile?.id)?.role;
                  const canManage =
                    profile?.id === expense.created_by ||
                    userRole === 'owner' ||
                    userRole === 'admin';
                  const isHistoryOpen = selectedExpenseForHistory === expense.id;

                  return (
                    <optgroup key={expense.id} label="" className="contents">
                      <tr
                        className={`hover:bg-slate-900/30 transition-colors ${
                          isHistoryOpen ? 'bg-slate-900/10' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl p-1.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                              {getCategoryIcon(expense.category)}
                            </span>
                            <span className="text-white text-xs font-semibold">{expense.title}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-slate-300 text-xs font-medium">{payerName}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider border border-slate-800/80">
                            {expense.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          <span>{expense.participants?.length || 0} people</span>{' '}
                          <span className="text-slate-500">
                            ({expense.participants ? `₱${(expense.amount / expense.participants.length).toFixed(0)} each` : ''})
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="text-white font-extrabold text-xs">
                            ₱{expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedExpenseForHistory(
                                  isHistoryOpen ? null : expense.id
                                )
                              }
                              className={`p-1.5 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer ${
                                isHistoryOpen ? 'text-primary' : 'text-slate-400 hover:text-primary'
                              }`}
                              title="View Edit History"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                            {canManage && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onEditExpense(expense)}
                                  className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                                  title="Edit Expense"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm('Delete this expense?')) {
                                      deleteMutation.mutate(expense.id);
                                    }
                                  }}
                                  disabled={deleteMutation.isPending}
                                  className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                                  title="Delete Expense"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isHistoryOpen && (
                        <tr className="bg-slate-950/40">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-900 space-y-2.5 animate-slide-down max-w-xl text-left">
                              <div className="flex items-center justify-between pb-1.5 border-b border-slate-900/60">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <History className="w-3.5 h-3.5 text-primary" /> Expense History Log
                                </span>
                                <button
                                  onClick={() => setSelectedExpenseForHistory(null)}
                                  className="text-[9px] text-slate-500 hover:text-white"
                                >
                                  Hide
                                </button>
                              </div>

                              {history.length === 0 ? (
                                <p className="text-[9px] text-slate-500 py-1">No logs found.</p>
                              ) : (
                                <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                                  {history.map((h) => (
                                    <div key={h.id} className="text-[10px] leading-relaxed text-slate-400">
                                      <span className="text-slate-300 font-medium">{h.editor_name}</span>{' '}
                                      {h.field_name === 'created' ? (
                                        <span>created this expense.</span>
                                      ) : (
                                        <span>
                                          changed{' '}
                                          <span className="font-semibold text-slate-300">{h.field_name}</span>{' '}
                                          from <span className="line-through text-red-500/80">{h.old_value || 'none'}</span>{' '}
                                          to <span className="text-emerald-400 font-semibold">{h.new_value}</span>
                                        </span>
                                      )}
                                      <span className="text-[8px] text-slate-500 block">
                                        {new Date(h.edited_at).toLocaleDateString()} {new Date(h.edited_at).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </optgroup>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
