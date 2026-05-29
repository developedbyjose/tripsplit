import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { Expense } from '../../services/api';
import { X, Tag, Landmark, Users, Clipboard } from 'lucide-react';

interface ExpenseFormProps {
  spaceId: string;
  expenseToEdit: Expense | null;
  onClose: () => void;
}

const CATEGORIES = ['Food', 'Lodging', 'Transport', 'Activities', 'Others'];

export function ExpenseForm({ spaceId, expenseToEdit, onClose }: ExpenseFormProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [paidBy, setPaidBy] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [error, setError] = useState('');

  const { data: members = [] } = useQuery({
    queryKey: ['members', spaceId],
    queryFn: () => api.getMembers(spaceId),
  });

  useEffect(() => {
    if (expenseToEdit) {
      setTitle(expenseToEdit.title);
      setAmount(expenseToEdit.amount.toString());
      setCategory(expenseToEdit.category);
      setPaidBy(expenseToEdit.paid_by);
      setSelectedParticipants(expenseToEdit.participants || []);
    } else {
      // Clear fields
      setTitle('');
      setAmount('');
      setCategory('Food');
      // Default paidBy to current logged in user if they are a space member
      if (members.length > 0) {
        setPaidBy(members[0].user_id);
        // By default, select all members as split participants
        setSelectedParticipants(members.map((m) => m.user_id));
      }
    }
  }, [expenseToEdit, members]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error('Expense title is required');
      if (!amount || Number(amount) <= 0) throw new Error('Please enter a valid positive amount');
      if (!paidBy) throw new Error('Please select who paid this expense');
      if (selectedParticipants.length === 0) throw new Error('Please select at least one participant');

      const data = {
        space_id: spaceId,
        title: title.trim(),
        amount: Number(amount),
        category,
        paid_by: paidBy,
        split_type: 'equal' as const,
        participants: selectedParticipants,
      };

      if (expenseToEdit) {
        return await api.updateExpense(expenseToEdit.id, data);
      } else {
        return await api.createExpense(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', spaceId] });
      queryClient.invalidateQueries({ queryKey: ['settlements', spaceId] });
      queryClient.invalidateQueries({ queryKey: ['space-activity', spaceId] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.message || 'An error occurred saving expense');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    mutation.mutate();
  }

  function toggleParticipant(userId: string) {
    if (selectedParticipants.includes(userId)) {
      setSelectedParticipants(selectedParticipants.filter((id) => id !== userId));
    } else {
      setSelectedParticipants([...selectedParticipants, userId]);
    }
  }

  // Live split calculator display
  const numericAmount = Number(amount) || 0;
  const participantCount = selectedParticipants.length;
  const splitAmount = participantCount > 0 ? (numericAmount / participantCount).toFixed(2) : '0.00';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Tap outside container to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="w-full sm:max-w-md bg-slate-950 sm:rounded-3xl rounded-t-3xl border-t sm:border border-slate-800 p-6 space-y-5 z-10 animate-slide-up shadow-2xl relative max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-900/60">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {expenseToEdit ? 'Edit Expense' : 'Log Expense'}
            </h2>
            <p className="text-[11px] text-slate-400">Record a payment and split it with friends.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded-xl">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clipboard className="w-3.5 h-3.5 text-primary" /> Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Tricycle Fare, Dinner, Gas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          {/* Amount & Category */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Amount (₱)
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-primary" /> Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-950">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Paid By */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-primary" /> Paid By
            </label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
            >
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id} className="bg-slate-950">
                  {m.user?.name || 'Unknown member'}
                </option>
              ))}
            </select>
          </div>

          {/* Split participants checklist */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" /> Split With
              </label>
              <button
                type="button"
                onClick={() => {
                  if (selectedParticipants.length === members.length) {
                    setSelectedParticipants([]);
                  } else {
                    setSelectedParticipants(members.map((m) => m.user_id));
                  }
                }}
                className="text-[9px] text-primary font-bold hover:underline"
              >
                {selectedParticipants.length === members.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-[140px] overflow-y-auto border border-slate-900 bg-slate-900/40 rounded-xl p-2.5 space-y-2">
              {members.map((m) => {
                const isChecked = selectedParticipants.includes(m.user_id);
                return (
                  <div
                    key={m.user_id}
                    onClick={() => toggleParticipant(m.user_id)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={
                          m.user?.avatar_url ||
                          `https://api.dicebear.com/7.x/adventurer/svg?seed=${m.user_id}`
                        }
                        alt=""
                        className="w-5.5 h-5.5 rounded-full border border-slate-800"
                      />
                      <span className="text-xs text-white font-medium">{m.user?.name}</span>
                    </div>

                    <input
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      className="w-4.5 h-4.5 accent-primary border-slate-800 rounded bg-slate-900 text-primary focus:ring-0 focus:ring-offset-0"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Math display */}
          <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-3.5 text-center text-xs">
            <span className="text-slate-400">Each selected participant owes:</span>
            <div className="text-lg font-extrabold text-white mt-1.5">
              ₱{Number(splitAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {participantCount} of {members.length} members selected.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-medium rounded-xl py-3 text-sm transition-all active:scale-95 cursor-pointer text-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl py-3 text-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-primary/10 text-center"
          >
            {mutation.isPending ? 'Saving...' : expenseToEdit ? 'Save Changes' : 'Add Expense'}
          </button>
        </div>
      </form>
    </div>
  );
}
