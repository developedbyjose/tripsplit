# TripSplit ✈️💰

TripSplit is a collaborative **barkada travel budgeting web application** designed to simplify expense tracking, automate debt settlement computations, and provide complete financial transparency for group trips.

> **"Splitwise for Barkada Travel — collaborative, transparent, realtime."**

---

## 🚀 Key Features

*   **Travel Spaces:** Create shared travel hubs (e.g., *"Zambales Outing 2026"*) with customized permission settings.
*   **QR Join Flow:** Instantly invite friends to join your Travel Space by generating a secure invite token and scan-ready QR code.
*   **Collaborative Expense Tracking:** Allows all members to add expenses, log splits, and review itemized histories.
*   **Realtime Calculations & Settlements:** Automatically computes debt settlements using a greedy minimization algorithm to simplify "who owes whom".
*   **Transparency & Audit History:** Every edit or addition logs an audit trail (`Created By`, `Last Edited By`, and detailed changes like `₱1800 → ₱2000`).
*   **Analytics Dashboard:** KPI cards (Total Expenses, Personal Balance, Top Spender) and Recharts visuals showing expenses by category.

---

## 🛠 Tech Stack

### Frontend
*   **Framework:** React 19 + TypeScript + Vite
*   **Styling:** Tailwind CSS + Shadcn UI (Radix Primitives)
*   **State & Fetching:** TanStack Query (React Query)
*   **Form Validation:** React Hook Form + Zod
*   **Charts:** Recharts

### Backend & Infrastructure
*   **Backend:** Supabase (Database, Auth, and Realtime subscriptions)
*   **Database:** PostgreSQL (with triggers, functions, and Row Level Security)
*   **Deployment:** Vercel (Frontend), Supabase (Backend/Database)

---

## 📁 Folder Structure

```text
src/
├── app/                  # Providers & wrappers (QueryClient, Supabase client)
├── components/           # Reusable generic UI components (buttons, cards, inputs)
├── features/             # Feature-specific modules
│   ├── dashboard/        # KPI metrics & Recharts graphs
│   ├── expenses/         # CRUD for expenses & audit history feeds
│   ├── spaces/           # Space creation & QR invite joins
│   └── settlements/      # Balance computation & settlements
├── hooks/                # Global React hooks
├── services/             # Supabase API database queries
├── types/                # TypeScript declarations & Database schema types
└── utils/                # Calculation formulas & date/currency formatters
```

---

## ⚙️ Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm or pnpm
*   A Supabase Project

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file in the root directory (this file is blocked by `.gitignore` to prevent leaking API keys):
   ```env
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anonymous-key
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

---

## 🔒 Security & Code Quality

*   **Row Level Security (RLS):** All data accesses are secured directly inside PostgreSQL. Ensure RLS is enabled on all tables.
*   **Secret Protection:** Never write the `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` or reference it on the frontend.
*   **Local Skills:** Development guardrails, conventions, and review checklists are configured in `.agents/skills/` for:
    *   [tripsplit-frontend](file:///Users/jglumbao/Desktop/code/TripSplit/.agents/skills/tripsplit-frontend/SKILL.md)
    *   [tripsplit-backend](file:///Users/jglumbao/Desktop/code/TripSplit/.agents/skills/tripsplit-backend/SKILL.md)
    *   [tripsplit-security-reviewer](file:///Users/jglumbao/Desktop/code/TripSplit/.agents/skills/tripsplit-security-reviewer/SKILL.md)

