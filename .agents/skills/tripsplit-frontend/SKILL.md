---
name: tripsplit-frontend
description: Instructions, standards, and patterns for building the frontend of TripSplit, a collaborative travel budgeting web app. Use this skill when implementing or modifying React components, layouts, hooks, services, or page flows.
---

# TripSplit Frontend Development Skill

This skill provides comprehensive instructions, standards, and patterns for building and maintaining the frontend of **TripSplit** (a collaborative travel budgeting web app) based on the [PROJECT_PLAN.md](file:///Users/jglumbao/Desktop/code/TripSplit/PROJECT_PLAN.md).

---

## 1. Primary Stack & Tools

All frontend code must align with the designated primary stack:
*   **Core:** React 19 + TypeScript + Vite
*   **Styling:** Tailwind CSS + Shadcn UI
*   **Data Fetching & Cache:** TanStack Query (React Query)
*   **Form Management:** React Hook Form + Zod (validation schemas)
*   **Data Visualization:** Recharts
*   **Backend Client:** Supabase Client (Auth, database tables, and realtime channels)

---

## 2. Directory Structure

Ensure any new frontend module, file, or component adheres strictly to the following directory structure:

```text
src/
├── app/                  # Application wrappers, providers (QueryClient, Supabase, Theme)
├── components/           # Generic reusable UI components (buttons, dialogs, charts)
├── features/             # Feature-based folders containing custom hooks, components, and views
│   ├── dashboard/        # KPI analytics, charts, and overall space dashboard components
│   ├── expenses/         # Expense forms, lists, details, and history feeds
│   ├── spaces/           # Space creation, joining (QR code scanner), and management
│   └── settlements/      # Debts settlement summaries and status updates
├── hooks/                # Global custom hooks (e.g., useAuth, useMediaQuery)
├── services/             # Supabase API client methods and query functions
├── types/                # TypeScript type definitions and DB interface mappings
└── utils/                # Pure utility functions (calculation formulas, date formatters, currency helpers)
```

---

## 3. Design Aesthetics & Styling Guidelines

TripSplit must feature premium, mobile-first, and highly responsive web styling. Since users primarily access TripSplit from mobile devices while traveling, the UI must feel like a native mobile app.

### Mobile-First Layout Rules
*   **Default Mobile Views:** Build all structures targeting standard phone widths (320px - 480px) first, scaling up to larger screen breakpoints using Tailwind prefixes (`sm:`, `md:`, `lg:`).
*   **Bottom Navigation & Floating Actions:** Use a sticky bottom navigation bar (`fixed bottom-0 left-0 right-0`) for quick access to core sections (Dashboard, Expenses, Settlements, Settings) and a prominent Floating Action Button (FAB) for adding new expenses.
*   **Touch Targets & Spacing:** Ensure all touchable areas (buttons, inputs, links, list items) have a minimum dimension of **44x44px** to avoid accidental taps. Use spacing utilities (`space-y-4`, `gap-3`) to maintain visual breathing room.
*   **Responsive Overlays:** Replace wide modal dialogs on mobile views with bottom drawers/sheets (`vaul` or native sheet component) that slide up from the bottom of the screen.

### Typography & Spacing
*   Use premium modern sans-serif typefaces (e.g., **Inter** or **Outfit**) loaded from Google Fonts.
*   Keep text sizes highly readable on small screens: headings should scale nicely (`text-2xl` on mobile vs. `text-4xl` on desktop) and body text should not drop below `text-sm` (14px).

### Color Palette (HSL Tailored)
*   Define semantic HSL variables in `src/index.css` for light and dark modes (primary, secondary, background, card, border, accents).
*   Avoid generic raw color classes (e.g., `bg-red-500` or `text-blue-600`). Use Tailwind variables like `bg-primary`, `text-destructive`, `bg-accent`, `bg-card`.

### Glassmorphism & Micro-animations
*   Use subtle backdrop blur effects (`backdrop-blur-md bg-white/10` or `bg-slate-900/40 border border-white/10`) for overlays, bottom sheets, and headers to achieve a modern frosted glass aesthetic.
*   Apply soft hover transformations and transitions (`transition-all duration-300 ease-in-out hover:scale-[1.02] active:scale-95`) to cards, buttons, and items in the activity feed, keeping touch feedback immediate.

---

## 4. Key Calculation & Business Logic

When writing code for settlement computation or split calculations, enforce the following logic on the client:

### A. Equal Split calculation
*   Formula:
    $$\text{Participant Share} = \frac{\text{Total Expense Amount}}{\text{Number of Active Participants}}$$
*   Always perform calculation using float arithmetic and format correctly using the regional currency utility (e.g., Philippine Peso `₱`).

### B. Balance Computation
*   Calculate the balance per space member:
    $$\text{Balance} = \text{Total Paid} - \text{Total Owed}$$
*   **Interpretation:**
    *   `Balance > 0`: User is a creditor (should receive money).
    *   `Balance < 0`: User is a debtor (owes money).
    *   `Balance == 0`: User is settled up.
*   Use these balances to run a debt simplification algorithm on the client or database to generate minimal settlements (debtor $\to$ creditor).

---

## 5. Feature Implementation Rules

### A. Collaborative Editing & Audit History
*   When editing an expense, the client must display the changes in a transparent **Expense History Feed** (Audit Log) showing:
    *   Who performed the modification.
    *   The changed fields (e.g., `1800 → 2000`, or category changes).
    *   Timestamp of the action.
*   Check user role permissions before rendering editing widgets:
    *   **Owner:** Can lock/unlock space, toggle permissions, manage members, delete space.
    *   **Admin:** Manage all expenses, generate invites.
    *   **Member:** Create expenses, edit only their own expenses (unless the workspace setting `Allow all members to edit all expenses` is checked).

### B. Realtime Sync & TanStack Query
*   Subscribe to Supabase Realtime Channels for tables `expenses`, `expense_history`, `members`, and `settlements` to automatically invalidate TanStack Query keys or update state:
    ```typescript
    supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, payload => {
        queryClient.invalidateQueries({ queryKey: ['expenses', spaceId] });
      })
      .subscribe();
    ```

### C. Forms & Validation
*   Always wrap input forms in `React Hook Form`.
*   Validate all fields using `Zod` schemas (e.g., title, positive amount, valid category, and selected participants list) before hitting the API.

---

## 6. Verification Checklist
Before submitting any frontend changes:
1.  Verify the TypeScript compilation succeeds: `npm run build` or `npx tsc --noEmit`.
2.  Test responsive layouts across mobile viewport sizes.
3.  Ensure state updates dynamically without requiring full browser refreshes.
