import type { Expense, Member } from '../services/api';

export interface MemberBalance {
  userId: string;
  name: string;
  avatarUrl: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
}

export interface SimplifiedDebt {
  debtorId: string;
  debtorName: string;
  debtorAvatar: string;
  creditorId: string;
  creditorName: string;
  creditorAvatar: string;
  amount: number;
}

/**
 * Computes individual total payments, total shares, and net balance for all space members.
 */
export function calculateBalances(expenses: Expense[], members: Member[]): MemberBalance[] {
  const balances: Record<string, { paid: number; owed: number }> = {};

  // Initialize for all members
  members.forEach((m) => {
    balances[m.user_id] = { paid: 0, owed: 0 };
  });

  // Accumulate expense details
  expenses.forEach((expense) => {
    const paidBy = expense.paid_by;
    const amount = Number(expense.amount);
    
    // Increment payer total paid
    if (balances[paidBy]) {
      balances[paidBy].paid += amount;
    }

    const participants = expense.participants || [];
    const participantCount = participants.length;
    
    if (participantCount > 0) {
      // Calculate equal share
      const share = amount / participantCount;
      participants.forEach((pId) => {
        if (balances[pId]) {
          balances[pId].owed += share;
        }
      });
    }
  });

  return members.map((m) => {
    const record = balances[m.user_id] || { paid: 0, owed: 0 };
    return {
      userId: m.user_id,
      name: m.user?.name || 'Unknown',
      avatarUrl: m.user?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${m.user_id}`,
      totalPaid: record.paid,
      totalOwed: record.owed,
      netBalance: record.paid - record.owed,
    };
  });
}

/**
 * Greedy Settlement Algorithm (Debt Simplification)
 * Matches largest debtors with largest creditors to minimize transactions.
 */
export function simplifyDebts(balances: MemberBalance[]): SimplifiedDebt[] {
  // Deep copy and filter out users with balances very close to zero
  const debtors = balances
    .filter((b) => b.netBalance < -0.01)
    .map((b) => ({ ...b, netBalance: Math.abs(b.netBalance) }))
    .sort((a, b) => b.netBalance - a.netBalance); // Descending (largest debtor first)

  const creditors = balances
    .filter((b) => b.netBalance > 0.01)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.netBalance - a.netBalance); // Descending (largest creditor first)

  const transactions: SimplifiedDebt[] = [];

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const amount = Math.min(debtor.netBalance, creditor.netBalance);

    if (amount > 0.01) {
      transactions.push({
        debtorId: debtor.userId,
        debtorName: debtor.name,
        debtorAvatar: debtor.avatarUrl,
        creditorId: creditor.userId,
        creditorName: creditor.name,
        creditorAvatar: creditor.avatarUrl,
        amount: Number(amount.toFixed(2)),
      });
    }

    // Deduct transaction amounts
    debtor.netBalance -= amount;
    creditor.netBalance -= amount;

    if (debtor.netBalance < 0.01) dIdx++;
    if (creditor.netBalance < 0.01) cIdx++;
  }

  return transactions;
}
