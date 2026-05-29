---
name: tripsplit-backend
description: Instructions, architectural patterns, database schemas, and security guidelines for designing and building the TripSplit backend using PostgreSQL, Supabase, RLS policies, triggers, and transactions.
---

# TripSplit Backend & Database Development Skill

This skill provides professional guidelines, database schema specifications, and security practices for building the backend layer of **TripSplit** using **Supabase** and **PostgreSQL**.

---

## 1. Database Schema & Data Integrity

A senior-level database design prioritizes strict data integrity and type safety. Leverage PostgreSQL constraints and types extensively.

### Enforce Constraints
*   **Categories & Statuses:** Avoid free-text fields. Use custom PostgreSQL `ENUM` types or check constraints for fields like `role` (`'owner'`, `'admin'`, `'member'`), `split_type` (`'equal'`, `'exact'`, `'percentage'`), and `status` (`'active'`, `'locked'`, `'archived'`, `'settled'`).
*   **Numeric Precision:** Use the `NUMERIC(12, 2)` datatype for all currency fields (`amount`, `share_amount`) to prevent floating-point rounding errors. Add check constraints to guarantee positive values where applicable (e.g., `CHECK (amount > 0)`).
*   **Cascading Deletes:** Carefully configure foreign keys (`ON DELETE CASCADE` vs. `ON DELETE SET NULL`). For example, deleting a `space` should cascade and delete its `members` and `expenses`, but deleting a `user` should not wipe historical expense records (use `SET NULL` or soft deletes).

---

## 2. Row Level Security (RLS) Policies

Supabase runs on PostgreSQL, meaning security must be enforced at the database level using Row Level Security (RLS). **Do not rely on the client to filter data securely.**

### RLS Policy Rules
*   **Spaces Table:**
    *   `SELECT`: Allow read if the user's ID is in the `members` table for that `space_id`.
    *   `INSERT`: Allowed for any authenticated user (the creator becomes the `'owner'`).
    *   `UPDATE/DELETE`: Only allow if the user has the `'owner'` role in that space.
*   **Members Table:**
    *   `SELECT`: Allow if the user is currently a member of the same space.
    *   `INSERT`: Allow if the user is the owner of the space, or if they present a valid invite token (verified via function).
*   **Expenses & Settlements:**
    *   `SELECT/INSERT/UPDATE`: Only allow if the user is a member of the corresponding space.
    *   Additional rule: For updating an expense, ensure the user is either the creator, an admin, or the space setting `allow_all_members_to_edit` is true.

*Example Helper Function:*
```sql
CREATE OR REPLACE FUNCTION is_space_member(space_id UUID, user_id UUID)
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM members WHERE members.space_id = $1 AND members.user_id = $2
  );
END;
$$ LANGUAGE plpgsql;
```

---

## 3. Transaction Management & Atomicity

Complex actions must be written using PostgreSQL functions (RPCs) or transactional queries to prevent partial writes.

### A. Creating an Expense
Inserting an expense requires a database transaction wrapping:
1.  Inserting the main row into `expenses`.
2.  Inserting multiple rows into `expense_participants`.
3.  Generating an initial entry in `expense_history`.
*Rule:* Wrap these inserts in a Supabase database function (`plpgsql`) to execute it atomically in a single network request.

### B. Settling Balances (Debt Simplification)
Calculating minimal settlements follows a standard balance matching approach:
1.  Sum all payments and debts for each member to get their net balance:
    $$\text{net\_balance}_i = \sum \text{Paid By } i - \sum \text{Owed By } i$$
2.  Separate members into **Debtors** (negative balance) and **Creditors** (positive balance).
3.  Sort both lists and greedily match the largest debtor with the largest creditor:
    $$\text{transfer\_amount} = \min(|\text{debtor\_balance}|, \text{creditor\_balance})$$
4.  Record this match in the `settlements` table and update the balances. Repeat until all balances are near zero.

---

## 4. Automated History Tracking (Triggers)

To maintain a transparent audit trail, use a PostgreSQL trigger to automatically log modifications to the `expenses` table into the `expense_history` table.

```sql
CREATE OR REPLACE FUNCTION log_expense_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Track Title changes
  IF OLD.title IS DISTINCT FROM NEW.title THEN
    INSERT INTO expense_history(expense_id, field_name, old_value, new_value, edited_by)
    VALUES (NEW.id, 'title', OLD.title, NEW.title, auth.uid());
  END IF;

  -- Track Amount changes
  IF OLD.amount IS DISTINCT FROM NEW.amount THEN
    INSERT INTO expense_history(expense_id, field_name, old_value, new_value, edited_by)
    VALUES (NEW.id, 'amount', OLD.amount::text, NEW.amount::text, auth.uid());
  END IF;

  -- Track Category changes
  IF OLD.category IS DISTINCT FROM NEW.category THEN
    INSERT INTO expense_history(expense_id, field_name, old_value, new_value, edited_by)
    VALUES (NEW.id, 'category', OLD.category, NEW.category, auth.uid());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_expense_change
AFTER UPDATE ON expenses
FOR EACH ROW
EXECUTE FUNCTION log_expense_change();
```

---

## 5. Performance Optimization & Indexing

To guarantee sub-second dashboard updates and timeline loads, apply indexes on foreign keys and commonly filtered columns.

### Required Indexes
*   **Foreign Keys:** `CREATE INDEX idx_members_space ON members(space_id);`, `CREATE INDEX idx_expenses_space ON expenses(space_id);`, `CREATE INDEX idx_participants_expense ON expense_participants(expense_id);`
*   **Composite Indexing:** For loading expense timelines inside a space:
    ```sql
    CREATE INDEX idx_expenses_space_created ON expenses(space_id, created_at DESC);
    ```
*   **Invite Token Lookup:** Unique index on invite tokens for rapid verification:
    ```sql
    CREATE UNIQUE INDEX idx_invites_token ON invites(token) WHERE (expires_at > now());
    ```

---

## 6. Verification Checklist
Before deploying database migrations, trigger functions, or schema changes:
1.  Verify database schemas using SQL linter tools or dry-run migrations.
2.  Ensure that all RLS policies are active (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).
3.  Test edge cases in transactions (e.g., trying to add an expense with zero participants, or updating a locked space).
