-- TripSplit PostgreSQL Database Schema Setup
-- Run this script inside your Supabase project's SQL Editor to set up all tables, RLS policies, triggers, and RPC transactions.

-- =========================================================================
-- 1. Table Definitions & Constraints
-- =========================================================================

-- Public Users table (stores profile data synchronized from auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Spaces table
CREATE TABLE IF NOT EXISTS public.spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    qr_enabled BOOLEAN DEFAULT true NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'locked', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Space Members table
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT unique_space_member UNIQUE (space_id, user_id)
);

-- Expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL,
    paid_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    split_type TEXT DEFAULT 'equal' NOT NULL CHECK (split_type IN ('equal', 'exact', 'percentage')),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Expense Participants table (tracks individual shares of each expense)
CREATE TABLE IF NOT EXISTS public.expense_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    share_amount NUMERIC(12, 2) NOT NULL CHECK (share_amount >= 0),
    CONSTRAINT unique_expense_participant UNIQUE (expense_id, member_id)
);

-- Expense History (Audit trail) table
CREATE TABLE IF NOT EXISTS public.expense_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    edited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    edited_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Settlements table
CREATE TABLE IF NOT EXISTS public.settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
    debtor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    creditor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'settled')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT unique_debtor_creditor UNIQUE (space_id, debtor_id, creditor_id)
);

-- Invites table
CREATE TABLE IF NOT EXISTS public.invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =========================================================================
-- 2. Indexes for Performance Optimization
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_members_space ON public.members(space_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON public.members(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_space ON public.expenses(space_id);
CREATE INDEX IF NOT EXISTS idx_expenses_space_created ON public.expenses(space_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_participants_expense ON public.expense_participants(expense_id);
CREATE INDEX IF NOT EXISTS idx_history_expense ON public.expense_history(expense_id);
CREATE INDEX IF NOT EXISTS idx_settlements_space ON public.settlements(space_id);
CREATE INDEX IF NOT EXISTS idx_invites_token ON public.invites(token) WHERE (expires_at > now());

-- =========================================================================
-- 3. Row Level Security (RLS) Policies
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Helper validation function
CREATE OR REPLACE FUNCTION public.is_space_member(space_id UUID, user_id UUID)
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.members WHERE members.space_id = $1 AND members.user_id = $2
  );
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for Users table
CREATE POLICY "Users are readable by anyone authenticated" ON public.users
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE TO authenticated USING (auth.uid() = id);

-- RLS Policies for Spaces table
CREATE POLICY "Spaces are viewable by members" ON public.spaces
    FOR SELECT TO authenticated USING (public.is_space_member(id, auth.uid()));

CREATE POLICY "Any authenticated user can create spaces" ON public.spaces
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their spaces" ON public.spaces
    FOR UPDATE TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their spaces" ON public.spaces
    FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- RLS Policies for Members table
CREATE POLICY "Members are viewable by members of the same space" ON public.members
    FOR SELECT TO authenticated USING (public.is_space_member(space_id, auth.uid()));

CREATE POLICY "Space owners can manage members" ON public.members
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.spaces WHERE id = space_id AND owner_id = auth.uid())
    );

CREATE POLICY "Users can join space with a token (controlled via RPC)" ON public.members
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can leave spaces" ON public.members
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for Expenses table
CREATE POLICY "Expenses are viewable by space members" ON public.expenses
    FOR SELECT TO authenticated USING (public.is_space_member(space_id, auth.uid()));

CREATE POLICY "Space members can create expenses" ON public.expenses
    FOR INSERT TO authenticated WITH CHECK (public.is_space_member(space_id, auth.uid()));

CREATE POLICY "Space members can update expenses" ON public.expenses
    FOR UPDATE TO authenticated USING (
        public.is_space_member(space_id, auth.uid()) AND (
            auth.uid() = created_by OR 
            auth.uid() = paid_by OR
            EXISTS (SELECT 1 FROM public.members WHERE space_id = expenses.space_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
        )
    );

CREATE POLICY "Space members can delete expenses" ON public.expenses
    FOR DELETE TO authenticated USING (
        public.is_space_member(space_id, auth.uid()) AND (
            auth.uid() = created_by OR 
            EXISTS (SELECT 1 FROM public.members WHERE space_id = expenses.space_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
        )
    );

-- RLS Policies for Expense Participants table
CREATE POLICY "Participants are viewable by space members" ON public.expense_participants
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.expenses 
            WHERE expenses.id = expense_participants.expense_id 
            AND public.is_space_member(expenses.space_id, auth.uid())
        )
    );

CREATE POLICY "Participants can be inserted by space members" ON public.expense_participants
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.expenses 
            WHERE expenses.id = expense_participants.expense_id 
            AND public.is_space_member(expenses.space_id, auth.uid())
        )
    );

CREATE POLICY "Participants can be updated by space members" ON public.expense_participants
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.expenses 
            WHERE expenses.id = expense_participants.expense_id 
            AND public.is_space_member(expenses.space_id, auth.uid())
        )
    );

CREATE POLICY "Participants can be deleted by space members" ON public.expense_participants
    FOR DELETE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.expenses 
            WHERE expenses.id = expense_participants.expense_id 
            AND public.is_space_member(expenses.space_id, auth.uid())
        )
    );

-- RLS Policies for Expense History table
CREATE POLICY "History is viewable by space members" ON public.expense_history
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.expenses 
            WHERE expenses.id = expense_history.expense_id 
            AND public.is_space_member(expenses.space_id, auth.uid())
        )
    );

-- RLS Policies for Settlements table
CREATE POLICY "Settlements are viewable by space members" ON public.settlements
    FOR SELECT TO authenticated USING (public.is_space_member(space_id, auth.uid()));

CREATE POLICY "Settlements can be created/updated by space members" ON public.settlements
    FOR ALL TO authenticated USING (public.is_space_member(space_id, auth.uid()));

-- RLS Policies for Invites table
CREATE POLICY "Invites are readable by members of the space" ON public.invites
    FOR SELECT TO authenticated USING (public.is_space_member(space_id, auth.uid()));

CREATE POLICY "Invites can be created by space owners or admins" ON public.invites
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.members 
            WHERE space_id = invites.space_id 
            AND user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- =========================================================================
-- 4. Triggers for Automated Synchronization & History Logging
-- =========================================================================

-- Sync user profiles from auth.users on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      email = EXCLUDED.email,
      avatar_url = EXCLUDED.avatar_url;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Log modifications on expenses
CREATE OR REPLACE FUNCTION public.log_expense_change()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Track Title changes
  IF OLD.title IS DISTINCT FROM NEW.title THEN
    INSERT INTO public.expense_history(expense_id, field_name, old_value, new_value, edited_by)
    VALUES (NEW.id, 'title', OLD.title, NEW.title, current_user_id);
  END IF;

  -- Track Amount changes
  IF OLD.amount IS DISTINCT FROM NEW.amount THEN
    INSERT INTO public.expense_history(expense_id, field_name, old_value, new_value, edited_by)
    VALUES (NEW.id, 'amount', OLD.amount::text, NEW.amount::text, current_user_id);
  END IF;

  -- Track Category changes
  IF OLD.category IS DISTINCT FROM NEW.category THEN
    INSERT INTO public.expense_history(expense_id, field_name, old_value, new_value, edited_by)
    VALUES (NEW.id, 'category', OLD.category, NEW.category, current_user_id);
  END IF;

  -- Track Paid By changes
  IF OLD.paid_by IS DISTINCT FROM NEW.paid_by THEN
    INSERT INTO public.expense_history(expense_id, field_name, old_value, new_value, edited_by)
    VALUES (NEW.id, 'paid_by', OLD.paid_by::text, NEW.paid_by::text, current_user_id);
  END IF;

  -- Update audit fields
  NEW.updated_at := now();
  NEW.updated_by := current_user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_log_expense_change
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.log_expense_change();

-- =========================================================================
-- 5. Transactional RPC Database Functions
-- =========================================================================

-- Atomic creation of space, automatically adding creator as 'owner'
CREATE OR REPLACE FUNCTION public.create_space_transaction(
  p_name TEXT,
  p_description TEXT
) RETURNS UUID AS $$
DECLARE
  v_space_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Create space
  INSERT INTO public.spaces (name, description, owner_id)
  VALUES (p_name, p_description, current_user_id)
  RETURNING id INTO v_space_id;

  -- Add owner member
  INSERT INTO public.members (space_id, user_id, role)
  VALUES (v_space_id, current_user_id, 'owner');

  RETURN v_space_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic RPC to insert an expense, its participants, and log created history
CREATE OR REPLACE FUNCTION public.create_expense_transaction(
  p_space_id UUID,
  p_title TEXT,
  p_amount NUMERIC(12,2),
  p_category TEXT,
  p_paid_by UUID,
  p_split_type TEXT,
  p_participants UUID[],
  p_shares NUMERIC(12,2)[]
) RETURNS UUID AS $$
DECLARE
  v_expense_id UUID;
  current_user_id UUID;
  i INT;
BEGIN
  current_user_id := auth.uid();

  -- Verify membership
  IF NOT public.is_space_member(p_space_id, current_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: User is not a member of this space';
  END IF;

  -- Insert into expenses
  INSERT INTO public.expenses (space_id, title, amount, category, paid_by, split_type, created_by, updated_by)
  VALUES (p_space_id, p_title, p_amount, p_category, p_paid_by, p_split_type, current_user_id, current_user_id)
  RETURNING id INTO v_expense_id;

  -- Insert into expense_participants
  FOR i IN 1 .. array_length(p_participants, 1) LOOP
    INSERT INTO public.expense_participants (expense_id, member_id, share_amount)
    VALUES (v_expense_id, p_participants[i], p_shares[i]);
  END LOOP;

  -- Log initial history
  INSERT INTO public.expense_history (expense_id, field_name, old_value, new_value, edited_by)
  VALUES (
    v_expense_id, 
    'created', 
    NULL, 
    p_title || ' of ₱' || p_amount::text || ' paid by ' || (SELECT name FROM public.users WHERE id = p_paid_by LIMIT 1), 
    current_user_id
  );

  RETURN v_expense_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic RPC to update an expense, clear participants, insert updated list
CREATE OR REPLACE FUNCTION public.update_expense_transaction(
  p_expense_id UUID,
  p_title TEXT,
  p_amount NUMERIC(12,2),
  p_category TEXT,
  p_paid_by UUID,
  p_split_type TEXT,
  p_participants UUID[],
  p_shares NUMERIC(12,2)[]
) RETURNS VOID AS $$
DECLARE
  v_space_id UUID;
  current_user_id UUID;
  i INT;
BEGIN
  current_user_id := auth.uid();
  
  -- Resolve space id
  SELECT space_id INTO v_space_id FROM public.expenses WHERE id = p_expense_id;

  -- Verify membership
  IF NOT public.is_space_member(v_space_id, current_user_id) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Update expense record
  UPDATE public.expenses
  SET title = p_title,
      amount = p_amount,
      category = p_category,
      paid_by = p_paid_by,
      split_type = p_split_type,
      updated_by = current_user_id,
      updated_at = now()
  WHERE id = p_expense_id;

  -- Delete previous participants
  DELETE FROM public.expense_participants WHERE expense_id = p_expense_id;

  -- Insert new participants list
  FOR i IN 1 .. array_length(p_participants, 1) LOOP
    INSERT INTO public.expense_participants (expense_id, member_id, share_amount)
    VALUES (p_expense_id, p_participants[i], p_shares[i]);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic RPC to join a travel space using an invite token
CREATE OR REPLACE FUNCTION public.join_space_with_token(
  p_token TEXT
) RETURNS UUID AS $$
DECLARE
  v_space_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Find token info
  SELECT space_id, expires_at INTO v_space_id, v_expires_at
  FROM public.invites
  WHERE token = p_token;

  IF v_space_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite link.';
  END IF;

  IF v_expires_at < now() THEN
    RAISE EXCEPTION 'Invite link has expired.';
  END IF;

  -- Register user membership
  INSERT INTO public.members (space_id, user_id, role)
  VALUES (v_space_id, current_user_id, 'member')
  ON CONFLICT (space_id, user_id) DO NOTHING;

  RETURN v_space_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
