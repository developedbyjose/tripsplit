import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { calculateBalances, simplifyDebts } from '../../utils/settlementUtils';
import { CheckCircle2, DollarSign, Award, Landmark } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SettlementSummaryProps {
  spaceId: string;
}

export function SettlementSummary({ spaceId }: SettlementSummaryProps) {
  const queryClient = useQueryClient();
  const [settlingDebt, setSettlingDebt] = useState<{ debtorId: string; creditorId: string; amount: number } | null>(null);

  const { data: members = [] } = useQuery({
    queryKey: ['members', spaceId],
    queryFn: () => api.getMembers(spaceId),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', spaceId],
    queryFn: () => api.getExpenses(spaceId),
  });

  const settleMutation = useMutation({
    mutationFn: async ({ debtorId, creditorId, amount, debtorName, creditorName }: { debtorId: string; creditorId: string; amount: number; debtorName: string; creditorName: string }) => {
      // Record settlement payment as a ledger expense
      return await api.createExpense({
        space_id: spaceId,
        title: `Settle: ${debtorName} paid ${creditorName}`,
        amount,
        category: 'Others',
        paid_by: debtorId,
        split_type: 'equal',
        participants: [creditorId],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', spaceId] });
      queryClient.invalidateQueries({ queryKey: ['settlements', spaceId] });
      queryClient.invalidateQueries({ queryKey: ['space-activity', spaceId] });
      setSettlingDebt(null);
      
      // Fire confetti burst!
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.8 }
      });
    },
  });

  const balances = calculateBalances(expenses, members);
  const simplifiedDebts = simplifyDebts(balances);

  const getMemberName = (userId: string) => {
    return members.find((m) => m.user_id === userId)?.user?.name || 'Someone';
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Balances & Settlements</h2>
        <p className="text-xs text-slate-400">See who stands where and settle debts instantly.</p>
      </div>

      {/* Member Balances Ledger */}
      <div className="glass-panel rounded-2xl p-4 space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Landmark className="w-4 h-4 text-primary" /> Barkada Ledger
        </h3>

        <div className="space-y-3">
          {balances.map((b) => {
            const isOwed = b.netBalance >= 0;
            return (
              <div key={b.userId} className="flex items-center justify-between p-2 hover:bg-slate-900/40 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <img src={b.avatarUrl} alt="" className="w-8 h-8 rounded-full border border-slate-800" />
                  <div>
                    <h4 className="text-white text-xs font-bold">{b.name}</h4>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      Paid: ₱{b.totalPaid.toFixed(0)} • Owed: ₱{b.totalOwed.toFixed(0)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-extrabold ${isOwed ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isOwed ? '+' : ''}₱{b.netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <p className="text-[8px] text-slate-500 mt-0.5">
                    {isOwed ? 'receives' : 'owes'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simplified Debts list */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-primary" /> Simplified Payments
        </h3>

        {simplifiedDebts.length === 0 ? (
          <div className="glass-panel rounded-2xl p-6 text-center space-y-2">
            <Award className="w-8 h-8 text-emerald-400 mx-auto animate-pulse" />
            <h4 className="text-white font-bold text-sm">Everyone is Settled!</h4>
            <p className="text-[10px] text-slate-400">All expenses are balanced out. Great job!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {simplifiedDebts.map((debt, index) => (
              <div key={index} className="glass-panel rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-2.5">
                    <img src={debt.debtorAvatar} alt="" className="w-7 h-7 rounded-full border border-slate-950 z-10" />
                    <img src={debt.creditorAvatar} alt="" className="w-7 h-7 rounded-full border border-slate-950" />
                  </div>
                  <div className="text-xs text-slate-300">
                    <span className="font-semibold text-white">{debt.debtorName}</span> owes{' '}
                    <span className="font-semibold text-white">{debt.creditorName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-white font-extrabold text-sm">
                    ₱{debt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <button
                    onClick={() => setSettlingDebt(debt)}
                    className="bg-primary/10 hover:bg-primary text-primary hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer active:scale-95 border border-primary/20 hover:border-transparent"
                  >
                    Settle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {settlingDebt && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">

          <div className="absolute inset-0" onClick={() => setSettlingDebt(null)} />
          <div className="w-full sm:max-w-xs bg-slate-950 sm:rounded-3xl rounded-t-3xl border-t sm:border border-slate-800 p-5 space-y-4 z-10 animate-slide-up shadow-2xl relative text-center">
            <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-1">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Record Payment</h3>
              <p className="text-xs text-slate-400 mt-1">
                Confirm that <span className="font-semibold text-white">{getMemberName(settlingDebt.debtorId)}</span> paid{' '}
                <span className="font-semibold text-white">{getMemberName(settlingDebt.creditorId)}</span> the amount of{' '}
                <span className="font-bold text-primary">₱{settlingDebt.amount}</span>.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSettlingDebt(null)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-semibold rounded-xl py-2.5 text-xs transition-all active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  settleMutation.mutate({
                    debtorId: settlingDebt.debtorId,
                    creditorId: settlingDebt.creditorId,
                    amount: settlingDebt.amount,
                    debtorName: getMemberName(settlingDebt.debtorId),
                    creditorName: getMemberName(settlingDebt.creditorId),
                  })
                }
                disabled={settleMutation.isPending}
                className="flex-1 bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl py-2.5 text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-primary/10"
              >
                {settleMutation.isPending ? 'Recording...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
