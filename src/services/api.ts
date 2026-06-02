import { supabase } from './supabaseClient';
import { formatCurrency } from '../utils/currency';

export interface Space {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  qr_enabled: boolean;
  status: 'active' | 'locked' | 'archived';
  created_at: string;
}

export interface Member {
  id: string;
  space_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  user?: {
    name: string;
    email: string;
    avatar_url: string;
  };
}

export interface Expense {
  id: string;
  space_id: string;
  title: string;
  amount: number;
  category: string;
  paid_by: string; // user_id
  split_type: 'equal' | 'exact' | 'percentage';
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  participants?: string[]; // Array of member user_ids participating
}

export interface ExpenseHistory {
  id: string;
  expense_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  edited_by: string;
  edited_at: string;
  editor_name?: string;
}

export interface Settlement {
  id: string;
  space_id: string;
  debtor_id: string;
  creditor_id: string;
  amount: number;
  status: 'pending' | 'settled';
  updated_at: string;
}

// =========================================================================
// Sandbox LocalStorage Database Prepopulation
// =========================================================================
const SANDBOX_KEY = 'tripsplit_sandbox_db';

function getSandboxDB() {
  const data = localStorage.getItem(SANDBOX_KEY);
  if (data) return JSON.parse(data);

  // Initialize with beautiful seed data for the reviewer
  const db = {
    spaces: [
      {
        id: 'space-zambales-2026',
        name: 'Zambales Outing 2026 🌊',
        description: 'Annual barkada trip to the beach! Surfing, bonfire, and stargazing.',
        owner_id: '00000000-0000-0000-0000-000000000001', // James
        qr_enabled: true,
        status: 'active',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ],
    users: [
      { id: '00000000-0000-0000-0000-000000000001', name: 'James', email: 'james@tripsplit.io', avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=James' },
      { id: '00000000-0000-0000-0000-000000000002', name: 'Jose', email: 'jose@tripsplit.io', avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jose' },
      { id: '00000000-0000-0000-0000-000000000003', name: 'Gly', email: 'gly@tripsplit.io', avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Gly' }
    ],
    members: [
      { id: 'm1', space_id: 'space-zambales-2026', user_id: '00000000-0000-0000-0000-000000000001', role: 'owner', joined_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'm2', space_id: 'space-zambales-2026', user_id: '00000000-0000-0000-0000-000000000002', role: 'admin', joined_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'm3', space_id: 'space-zambales-2026', user_id: '00000000-0000-0000-0000-000000000003', role: 'member', joined_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    expenses: [
      {
        id: 'exp1',
        space_id: 'space-zambales-2026',
        title: 'Tricycle Fare',
        amount: 1800,
        category: 'Transport',
        paid_by: '00000000-0000-0000-0000-000000000001', // James
        split_type: 'equal',
        created_by: '00000000-0000-0000-0000-000000000001',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        participants: ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003']
      },
      {
        id: 'exp2',
        space_id: 'space-zambales-2026',
        title: 'Beachside Villa Airbnb',
        amount: 6000,
        category: 'Lodging',
        paid_by: '00000000-0000-0000-0000-000000000002', // Jose
        split_type: 'equal',
        created_by: '00000000-0000-0000-0000-000000000002',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        participants: ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003']
      },
      {
        id: 'exp3',
        space_id: 'space-zambales-2026',
        title: 'Seafood Dinner Feast',
        amount: 2400,
        category: 'Food',
        paid_by: '00000000-0000-0000-0000-000000000003', // Gly
        split_type: 'equal',
        created_by: '00000000-0000-0000-0000-000000000003',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        participants: ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003'] // James and Gly only
      }
    ],
    expense_history: [
      {
        id: 'hist1',
        expense_id: 'exp1',
        field_name: 'created',
        old_value: null,
        new_value: `Tricycle Fare of ${formatCurrency(1800, 'PHP', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} paid by James`,
        edited_by: '00000000-0000-0000-0000-000000000001',
        edited_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'hist2',
        expense_id: 'exp2',
        field_name: 'created',
        old_value: null,
        new_value: `Beachside Villa Airbnb of ${formatCurrency(6000, 'PHP', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} paid by Jose`,
        edited_by: '00000000-0000-0000-0000-000000000002',
        edited_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'hist3',
        expense_id: 'exp3',
        field_name: 'created',
        old_value: null,
        new_value: `Seafood Dinner Feast of ${formatCurrency(2400, 'PHP', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} paid by Gly`,
        edited_by: '00000000-0000-0000-0000-000000000003',
        edited_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    settlements: [],
    invites: [
      { id: 'i1', space_id: 'space-zambales-2026', token: 'zambales2026', expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() }
    ]
  };
  saveSandboxDB(db);
  return db;
}

function saveSandboxDB(db: any) {
  localStorage.setItem(SANDBOX_KEY, JSON.stringify(db));
}

// Helper to determine if we are running in sandbox auth
function getIsSandbox() {
  return localStorage.getItem('tripsplit_sandbox_user') !== null;
}

function getSandboxUser() {
  const user = localStorage.getItem('tripsplit_sandbox_user');
  return user ? JSON.parse(user) : null;
}

// =========================================================================
// API Methods Layer
// =========================================================================

export const api = {
  // --- Spaces ---
  async getSpaces(): Promise<Space[]> {
    if (getIsSandbox()) {
      const db = getSandboxDB();
      const me = getSandboxUser();
      if (!me) return [];
      
      // Ensure current sandbox user is a member of the spaces returned
      const mySpaceIds = db.members
        .filter((m: any) => m.user_id === me.id)
        .map((m: any) => m.space_id);
      
      return db.spaces.filter((s: any) => mySpaceIds.includes(s.id));
    }

    const { data, error } = await supabase
      .from('spaces')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getSpace(spaceId: string): Promise<Space> {
    if (getIsSandbox()) {
      const db = getSandboxDB();
      const space = db.spaces.find((s: any) => s.id === spaceId);
      if (!space) throw new Error('Space not found');
      return space;
    }

    const { data, error } = await supabase
      .from('spaces')
      .select('*')
      .eq('id', spaceId)
      .single();

    if (error) throw error;
    return data;
  },

  async createSpace(name: string, description: string): Promise<string> {
    if (getIsSandbox()) {
      const db = getSandboxDB();
      const me = getSandboxUser();
      if (!me) throw new Error('Not logged in');

      const spaceId = 'space-' + Math.random().toString(36).substr(2, 9);
      
      const newSpace: Space = {
        id: spaceId,
        name,
        description,
        owner_id: me.id,
        qr_enabled: true,
        status: 'active',
        created_at: new Date().toISOString()
      };

      // Add space
      db.spaces.unshift(newSpace);

      // Save me as user if not already in DB
      if (!db.users.some((u: any) => u.id === me.id)) {
        db.users.push({ id: me.id, name: me.name, email: me.email, avatar_url: me.avatar_url });
      }

      // Add owner member
      db.members.push({
        id: 'mem-' + Math.random().toString(36).substr(2, 9),
        space_id: spaceId,
        user_id: me.id,
        role: 'owner',
        joined_at: new Date().toISOString()
      });

      saveSandboxDB(db);
      return spaceId;
    }

    const { data, error } = await supabase
      .rpc('create_space_transaction', {
        p_name: name,
        p_description: description
      });

    if (error) throw error;
    return data;
  },

  // --- Members ---
  async getMembers(spaceId: string): Promise<Member[]> {
    if (getIsSandbox()) {
      const db = getSandboxDB();
      const me = getSandboxUser();
      
      // Auto-insert current user profile if missing
      if (me && !db.users.some((u: any) => u.id === me.id)) {
        db.users.push({ id: me.id, name: me.name, email: me.email, avatar_url: me.avatar_url });
      }

      const spaceMembers = db.members.filter((m: any) => m.space_id === spaceId);
      
      return spaceMembers.map((m: any) => {
        const u = db.users.find((user: any) => user.id === m.user_id) || {
          id: m.user_id,
          name: me?.id === m.user_id ? me.name : 'Unknown User',
          email: me?.id === m.user_id ? me.email : 'unknown@domain.com',
          avatar_url: me?.id === m.user_id ? me.avatar_url : `https://api.dicebear.com/7.x/adventurer/svg?seed=${m.user_id}`
        };
        return {
          ...m,
          user: u
        };
      });
    }

    const { data, error } = await supabase
      .from('members')
      .select('*, user:users(*)')
      .eq('space_id', spaceId);

    if (error) throw error;
    return data || [];
  },

  // --- Expenses ---
  async getExpenses(spaceId: string): Promise<Expense[]> {
    if (getIsSandbox()) {
      const db = getSandboxDB();
      const spaceExpenses = db.expenses.filter((e: any) => e.space_id === spaceId);
      return spaceExpenses.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const { data, error } = await supabase
      .from('expenses')
      .select('*, participants:expense_participants(member_id)')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((exp: any) => ({
      ...exp,
      participants: exp.participants?.map((p: any) => p.member_id) || []
    }));
  },

  async createExpense(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'> & { participants: string[] }): Promise<string> {
    if (getIsSandbox()) {
      const db = getSandboxDB();
      const me = getSandboxUser();
      if (!me) throw new Error('Not logged in');

      const expId = 'exp-' + Math.random().toString(36).substr(2, 9);
      const now = new Date().toISOString();

      const newExpense: Expense = {
        id: expId,
        space_id: expense.space_id,
        title: expense.title,
        amount: Number(expense.amount),
        category: expense.category,
        paid_by: expense.paid_by,
        split_type: expense.split_type,
        created_by: me.id,
        updated_by: me.id,
        created_at: now,
        updated_at: now,
        participants: expense.participants
      };

      db.expenses.unshift(newExpense);

      // Create history log
      const payerName = db.users.find((u: any) => u.id === expense.paid_by)?.name || me.name;
      db.expense_history.push({
        id: 'hist-' + Math.random().toString(36).substr(2, 9),
        expense_id: expId,
        field_name: 'created',
        old_value: null,
        new_value: `${expense.title} of ${formatCurrency(Number(expense.amount), 'PHP', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} paid by ${payerName}`,
        edited_by: me.id,
        edited_at: now
      });

      saveSandboxDB(db);
      return expId;
    }

    // Prepare shares array (Equal split computation inside RPC)
    const shareCount = expense.participants.length;
    const splitShare = Number((Number(expense.amount) / shareCount).toFixed(2));
    
    // Equal distribution logic (adjust final item for rounding differences if needed, but database constraint is simple check)
    const shares = expense.participants.map((_, idx) => {
      if (idx === shareCount - 1) {
        return Number((Number(expense.amount) - (splitShare * (shareCount - 1))).toFixed(2));
      }
      return splitShare;
    });

    const { data, error } = await supabase
      .rpc('create_expense_transaction', {
        p_space_id: expense.space_id,
        p_title: expense.title,
        p_amount: Number(expense.amount),
        p_category: expense.category,
        p_paid_by: expense.paid_by,
        p_split_type: expense.split_type,
        p_participants: expense.participants,
        p_shares: shares
      });

    if (error) throw error;
    return data;
  },

  async updateExpense(expenseId: string, expense: Partial<Expense> & { participants: string[] }): Promise<void> {
    if (getIsSandbox()) {
      const db = getSandboxDB();
      const me = getSandboxUser();
      if (!me) throw new Error('Not logged in');

      const expIdx = db.expenses.findIndex((e: any) => e.id === expenseId);
      if (expIdx === -1) throw new Error('Expense not found');

      const oldExp = db.expenses[expIdx];
      const now = new Date().toISOString();

      // Log audit history modifications
      if (expense.title && oldExp.title !== expense.title) {
        db.expense_history.push({ id: 'hist-' + Math.random().toString(36).substr(2, 9), expense_id: expenseId, field_name: 'title', old_value: oldExp.title, new_value: expense.title, edited_by: me.id, edited_at: now });
      }
      if (expense.amount && Number(oldExp.amount) !== Number(expense.amount)) {
        db.expense_history.push({ id: 'hist-' + Math.random().toString(36).substr(2, 9), expense_id: expenseId, field_name: 'amount', old_value: oldExp.amount.toString(), new_value: expense.amount.toString(), edited_by: me.id, edited_at: now });
      }
      if (expense.category && oldExp.category !== expense.category) {
        db.expense_history.push({ id: 'hist-' + Math.random().toString(36).substr(2, 9), expense_id: expenseId, field_name: 'category', old_value: oldExp.category, new_value: expense.category, edited_by: me.id, edited_at: now });
      }
      if (expense.paid_by && oldExp.paid_by !== expense.paid_by) {
        db.expense_history.push({ id: 'hist-' + Math.random().toString(36).substr(2, 9), expense_id: expenseId, field_name: 'paid_by', old_value: oldExp.paid_by, new_value: expense.paid_by, edited_by: me.id, edited_at: now });
      }

      db.expenses[expIdx] = {
        ...oldExp,
        title: expense.title || oldExp.title,
        amount: expense.amount !== undefined ? Number(expense.amount) : oldExp.amount,
        category: expense.category || oldExp.category,
        paid_by: expense.paid_by || oldExp.paid_by,
        split_type: expense.split_type || oldExp.split_type,
        updated_by: me.id,
        updated_at: now,
        participants: expense.participants
      };

      saveSandboxDB(db);
      return;
    }

    const shareCount = expense.participants.length;
    const splitShare = Number((Number(expense.amount) / shareCount).toFixed(2));
    const shares = expense.participants.map((_, idx) => {
      if (idx === shareCount - 1) {
        return Number((Number(expense.amount) - (splitShare * (shareCount - 1))).toFixed(2));
      }
      return splitShare;
    });

    const { error } = await supabase
      .rpc('update_expense_transaction', {
        p_expense_id: expenseId,
        p_title: expense.title,
        p_amount: Number(expense.amount),
        p_category: expense.category,
        p_paid_by: expense.paid_by,
        p_split_type: expense.split_type,
        p_participants: expense.participants,
        p_shares: shares
      });

    if (error) throw error;
  },

  async deleteExpense(expenseId: string): Promise<void> {
    if (getIsSandbox()) {
      const db = getSandboxDB();
      db.expenses = db.expenses.filter((e: any) => e.id !== expenseId);
      db.expense_history = db.expense_history.filter((h: any) => h.expense_id !== expenseId);
      saveSandboxDB(db);
      return;
    }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) throw error;
  },

  // --- Audit Logs ---
  async getExpenseHistory(expenseId: string): Promise<ExpenseHistory[]> {
    if (getIsSandbox()) {
      const db = getSandboxDB();
      const histories = db.expense_history.filter((h: any) => h.expense_id === expenseId);
      return histories.map((h: any) => {
        const editor = db.users.find((u: any) => u.id === h.edited_by) || { name: 'Someone' };
        return {
          ...h,
          editor_name: editor.name
        };
      }).sort((a: any, b: any) => new Date(b.edited_at).getTime() - new Date(a.edited_at).getTime());
    }

    const { data, error } = await supabase
      .from('expense_history')
      .select('*, editor:users(name)')
      .eq('expense_id', expenseId)
      .order('edited_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((h: any) => ({
      ...h,
      editor_name: h.editor?.name || 'Someone'
    }));
  },

  // Custom function to load all space history
  async getSpaceActivityLog(spaceId: string): Promise<ExpenseHistory[]> {
    if (getIsSandbox()) {
      const db = getSandboxDB();
      const spaceExpenseIds = db.expenses.filter((e: any) => e.space_id === spaceId).map((e: any) => e.id);
      const histories = db.expense_history.filter((h: any) => spaceExpenseIds.includes(h.expense_id));
      
      return histories.map((h: any) => {
        const editor = db.users.find((u: any) => u.id === h.edited_by) || { name: 'Someone' };
        return {
          ...h,
          editor_name: editor.name
        };
      }).sort((a: any, b: any) => new Date(b.edited_at).getTime() - new Date(a.edited_at).getTime());
    }

    const { data, error } = await supabase
      .from('expense_history')
      .select('*, expense:expenses(space_id), editor:users(name)')
      .order('edited_at', { ascending: false });

    if (error) throw error;

    const filtered = (data || []).filter((h: any) => h.expense?.space_id === spaceId);
    return filtered.map((h: any) => ({
      ...h,
      editor_name: h.editor?.name || 'Someone'
    }));
  },

  // --- Invite tokens & scan ---
  async getOrGenerateInvite(spaceId: string): Promise<string> {
    if (getIsSandbox()) {
      const db = getSandboxDB();
      let invite = db.invites.find((i: any) => i.space_id === spaceId && new Date(i.expires_at).getTime() > Date.now());
      if (invite) return invite.token;

      const token = Math.random().toString(36).substr(2, 9);
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 Hours

      db.invites.push({
        id: 'i-' + Math.random().toString(36).substr(2, 9),
        space_id: spaceId,
        token,
        expires_at: expiresAt
      });
      saveSandboxDB(db);
      return token;
    }

    // Try to load existing
    const { data: existing } = await supabase
      .from('invites')
      .select('token')
      .eq('space_id', spaceId)
      .gt('expires_at', new Date().toISOString())
      .limit(1);

    if (existing && existing.length > 0) {
      return existing[0].token;
    }

    // Generate new token
    const token = Math.random().toString(36).substr(2, 12);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('invites')
      .insert({
        space_id: spaceId,
        token,
        expires_at: expiresAt
      });

    if (error) throw error;
    return token;
  },

  async joinSpace(token: string): Promise<string> {
    if (getIsSandbox()) {
      const db = getSandboxDB();
      const me = getSandboxUser();
      if (!me) throw new Error('Not logged in');

      const invite = db.invites.find((i: any) => i.token === token);
      if (!invite) throw new Error('Invalid invite link.');
      if (new Date(invite.expires_at).getTime() < Date.now()) throw new Error('Invite link has expired.');

      const spaceId = invite.space_id;

      // Add user to space member
      if (!db.members.some((m: any) => m.space_id === spaceId && m.user_id === me.id)) {
        db.members.push({
          id: 'mem-' + Math.random().toString(36).substr(2, 9),
          space_id: spaceId,
          user_id: me.id,
          role: 'member',
          joined_at: new Date().toISOString()
        });
      }

      // Add user profile to users list if missing
      if (!db.users.some((u: any) => u.id === me.id)) {
        db.users.push({ id: me.id, name: me.name, email: me.email, avatar_url: me.avatar_url });
      }

      saveSandboxDB(db);
      return spaceId;
    }

    const { data, error } = await supabase
      .rpc('join_space_with_token', { p_token: token });

    if (error) throw error;
    return data;
  },

  // --- Settlements ---
  async getSettlements(spaceId: string): Promise<Settlement[]> {
    if (getIsSandbox()) {
      const db = getSandboxDB();
      return db.settlements.filter((s: any) => s.space_id === spaceId && s.status === 'pending');
    }

    const { data, error } = await supabase
      .from('settlements')
      .select('*')
      .eq('space_id', spaceId)
      .eq('status', 'pending');

    if (error) throw error;
    return data || [];
  },

  async saveSettlement(spaceId: string, debtorId: string, creditorId: string, amount: number): Promise<void> {
    if (getIsSandbox()) {
      const db = getSandboxDB();
      const idx = db.settlements.findIndex((s: any) => s.space_id === spaceId && s.debtor_id === debtorId && s.creditor_id === creditorId);
      const settlement = {
        id: idx !== -1 ? db.settlements[idx].id : 'set-' + Math.random().toString(36).substr(2, 9),
        space_id: spaceId,
        debtor_id: debtorId,
        creditor_id: creditorId,
        amount,
        status: 'pending' as const,
        updated_at: new Date().toISOString()
      };
      
      if (idx !== -1) {
        db.settlements[idx] = settlement;
      } else {
        db.settlements.push(settlement);
      }
      saveSandboxDB(db);
      return;
    }

    const { error } = await supabase
      .from('settlements')
      .upsert({
        space_id: spaceId,
        debtor_id: debtorId,
        creditor_id: creditorId,
        amount,
        status: 'pending'
      }, {
        onConflict: 'space_id,debtor_id,creditor_id'
      });

    if (error) throw error;
  },

  async settleDebt(spaceId: string, debtorId: string, creditorId: string): Promise<void> {
    if (getIsSandbox()) {
      const db = getSandboxDB();
      const me = getSandboxUser();
      
      // Filter out this settlement (or mark settled)
      db.settlements = db.settlements.filter((s: any) => !(s.space_id === spaceId && s.debtor_id === debtorId && s.creditor_id === creditorId));
      
      // Let's create an expense that offsets this settlement, representing the transfer
      const debtorName = db.users.find((u: any) => u.id === debtorId)?.name || 'Someone';
      const creditorName = db.users.find((u: any) => u.id === creditorId)?.name || 'Someone';
      
      // Add a settlement log in history
      const now = new Date().toISOString();
      db.expense_history.push({
        id: 'hist-' + Math.random().toString(36).substr(2, 9),
        expense_id: 'exp1', // Reference root
        field_name: 'settled',
        old_value: null,
          new_value: `${debtorName} settled debt to ${creditorName}`,
        edited_by: me?.id || debtorId,
        edited_at: now
      });

      saveSandboxDB(db);
      return;
    }

    const { error } = await supabase
      .from('settlements')
      .delete()
      .eq('space_id', spaceId)
      .eq('debtor_id', debtorId)
      .eq('creditor_id', creditorId);

    if (error) throw error;
  }
};
