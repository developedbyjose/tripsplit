---
name: tripsplit-frontend-organizer
description: Guidelines, architectures, and auditing tools for reviewing and enforcing highly organized, modular, and maintainable React frontend folders and components. Use this skill when verifying file sizes, component splitting, and state separation in the frontend.
---

# TripSplit Frontend Folder Organization & Component Modularity Skill

This skill outlines the architectural standards, directory conventions, and auditing workflows to ensure the **TripSplit** frontend codebase remains highly organized, clean, and easy to maintain. It targets the prevention of monolithic components and encourages the decomposition of UI code into small, reusable, and single-purpose units.

---

## 1. Core Modularity Principles

To maintain high readability and ease of testing, all React components must adhere to these foundational principles:

### A. Single Responsibility Principle (SRP)
*   **One Component Per File:** Each file should export exactly one primary component (either as default or named export).
*   **Co-located Mini Helpers:** Small helper sub-elements (e.g., custom icon containers, internal list item shells) may live in the same file **only** if they are under 30 lines of code and are not reused anywhere else.
*   **Pure Functions:** Move non-React utility functions, data mapping helpers, or mathematical formatters out of component files and place them in `utils/` or helper sections.

### B. Size Boundaries and Complexity Thresholds
To prevent files from becoming hard to parse, components must respect the following hard limits:

| Metric | Recommendation | Hard Limit | Corrective Action |
| :--- | :--- | :--- | :--- |
| **File Line Count** | $< 150$ lines | $250$ lines | Split into smaller subcomponents or extract state logic. |
| **`useState` Hooks** | $\le 3$ hooks | $4$ hooks | Group into `useReducer`, object state, or extract to a custom hook. |
| **Combined Desktop & Mobile rendering** | Avoid single render block | Large duplication | Split into `*Mobile.tsx` and `*Desktop.tsx` files or use robust CSS grids. |
| **Nested Conditions (Ternary)** | $\le 1$ level | $2$ levels | Extract render branches into helper subcomponents or functions. |

---

## 2. Directory Structure and Placement Rules

Every frontend file must be placed in the appropriate folder inside `src/` to guarantee structural consistency:

```text
src/
├── app/                      # Application shells, global context providers, and wrappers
├── components/               # Global components shared across multiple features
│   ├── ui/                   # Primitive UI blocks (e.g., button, card, input, dialog) from shadcn/ui
│   └── common/               # Shared compound components (e.g., ErrorBoundary, GlobalSpinner)
├── features/                 # Modular feature domains
│   └── <feature_name>/       # E.g., dashboard, expenses, settlements, spaces, auth
│       ├── components/       # Feature-specific, reusable components (e.g., ExpenseCard.tsx)
│       ├── hooks/            # Custom hooks managing state/fetching for this feature (e.g., useExpenseList.ts)
│       ├── views/            # High-level feature pages and view containers (e.g., SettlementSummaryView.tsx)
│       └── types/            # Feature-specific TypeScript declarations
├── hooks/                    # Global React custom hooks (e.g., useMediaQuery, useAuth)
├── services/                 # Global API wrappers, Supabase clients, and data services
├── types/                    # System-wide type definitions and database interfaces
└── utils/                    # Global pure helper functions
```

### Component Placement Verification Flow
When creating a component, follow this flow to determine its path:
1.  **Is it a pure atomic UI widget (e.g., custom tooltip, tag badge, skeleton selector)?** Place in `src/components/ui/`.
2.  **Is it a complex layout or element shared across different features (e.g., space picker, user avatar cluster)?** Place in `src/components/common/`.
3.  **Is it specific to one business domain (e.g., expense form list, settlement calculator)?** Place in `src/features/<feature>/components/`.
4.  **Is it a page wrapper, route target, or full screen entry point?** Place in `src/features/<feature>/views/`.

---

## 3. State and Logic Separation Guidelines

Keep components declarative by separating **UI Rendering** from **State Management** and **Data Fetching**:

### A. Custom Hooks for Logic Extraction
If a component requires fetching data, handling mutations, and managing user state (e.g., open modal state, search query filters), extract that logic into a custom hook located in the feature's `hooks/` directory.

#### Monolithic Anti-Pattern (Combined Logic and Render)
```tsx
// src/features/expenses/ExpenseList.tsx (Violates Separation)
export function ExpenseList({ spaceId }) {
  const [filter, setFilter] = useState('');
  const { data: expenses } = useQuery({ queryKey: ['expenses', spaceId], queryFn: () => getExpenses(spaceId) });
  const deleteMutation = useMutation({ mutationFn: deleteExpense });

  // 150+ lines of render code...
}
```

#### Modular Design Pattern (Separated Logic and Render)
```typescript
// src/features/expenses/hooks/useExpenseList.ts (Clean State Layer)
export function useExpenseList(spaceId: string) {
  const [filter, setFilter] = useState('');
  const { data: expenses, isLoading } = useQuery({ queryKey: ['expenses', spaceId], queryFn: () => getExpenses(spaceId) });
  const deleteMutation = useMutation({ mutationFn: deleteExpense });

  return { filter, setFilter, expenses, isLoading, deleteExpense: deleteMutation.mutate };
}
```
```tsx
// src/features/expenses/components/ExpenseList.tsx (Clean Presentation Layer)
import { useExpenseList } from '../hooks/useExpenseList';

export function ExpenseList({ spaceId }) {
  const { filter, setFilter, expenses, isLoading, deleteExpense } = useExpenseList(spaceId);

  if (isLoading) return <LoadingSpinner />;
  return (
    <div>
      {/* Short render code... */}
    </div>
  );
}
```

---

## 4. Pre-Checklist for Code Organization & Refactoring

Before integrating or reviewing new code, evaluate components against this quick audit check:

*   [ ] **Line Count Rule:** Is the TSX file less than 200 lines? If not, identify boundaries (e.g., custom cards, tables, logs) to extract.
*   [ ] **Hook Limit Rule:** Does the component use 3 or fewer `useState` calls? If more, convert them to custom hooks or a combined state object.
*   [ ] **Separation Rule:** Are TanStack queries, mutations, or input validations placed in hooks or services? (No direct database queries or API logic inside the UI markup).
*   [ ] **Responsive Splitting:** If the component contains a massive `lg:block hidden` block and `lg:hidden block` block containing duplicated nested elements, split the mobile and desktop render logic into standalone files (e.g., `ExpenseCardMobile.tsx` and `ExpenseTableDesktop.tsx`).
*   [ ] **Clean Imports:** Ensure no deep relative path traversal is used (e.g., `../../../../components/`). Use path aliases or cleaner, shallow relative directories.

---

## 5. Automated Component Auditor Script

An auditing script is available to scan the frontend codebase and automatically report modularity or structure violations.

To audit files, run the custom Node.js script located in this skill:
```bash
node .agents/skills/tripsplit-frontend-organizer/scripts/audit-components.js
```

### What the script flags:
1.  **File Size Violations:** Warns on files $> 250$ lines, and fails on files $> 400$ lines.
2.  **Hook Count Excess:** Warns on components using $> 4$ state instances.
3.  **Direct DB / Service usage:** Warns if raw backend clients or API libraries are imported inside simple presentation components instead of clean custom hook integrations.
4.  **Ternary Depth:** Checks if nested conditional blocks are used excessively in UI rendering.
