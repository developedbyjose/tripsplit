---
name: tripsplit-security-reviewer
description: Guidelines and checklists for reviewing code updates for safety bugs, logic errors, and accidental leakage of API keys, credentials, or secrets. Use this skill when reviewing code changes or validating security configurations.
---

# TripSplit Code Reviewer & Security Auditing Skill

This skill outlines auditing workflows, safety rules, and checklists to review AI-generated code for potential errors, performance pitfalls, and secret leakage.

---

## 1. Zero-Leak Secret Policy (Crucial Safety)

To ensure API keys, database credentials, and service tokens are never committed to version control or exposed to the client side:

### A. Environment Variable Classification
*   **Public Credentials (Safe for Client):** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are safe to package on the frontend, as they rely on Row Level Security (RLS) policies to protect data.
*   **Private Credentials (NEVER client-side):** Database passwords, connection strings, `SUPABASE_SERVICE_ROLE_KEY`, or custom third-party secrets must **never** be prefix-exposed (e.g., via `VITE_`) or used in client-side code.

### B. Prevention Checklist
*   Check that `.env` or `.env.local` files containing secrets are explicitly listed in `.gitignore`.
*   Ensure that no private credential is hardcoded in any React component, Supabase service function, or local script.
*   Check that the Supabase client initialized on the frontend uses the anonymous key (`VITE_SUPABASE_ANON_KEY`), **never** the service role key.

---

## 2. Row Level Security & SQL Safety Audits

When reviewing backend database scripts, check for security vulnerabilities:

*   **RLS Check:** Ensure every database migration containing a `CREATE TABLE` is accompanied by:
    ```sql
    ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;
    ```
*   **Security Definer Functions:** If a database function is declared with `SECURITY DEFINER` (which runs with the privileges of the creator/admin), it **must** explicitly validate the user requesting the action using `auth.uid()` or the custom `is_space_member` function.
*   **SQL Injection Prevention:** Never construct SQL queries inside database functions by concatenating strings containing user input. Always use parameterized queries or built-in PostgreSQL binding mechanisms.

---

## 3. Frontend Error & Resource Leak Auditing

Review frontend updates to avoid memory leaks, crashes, and broken UI state:

*   **Realtime Subscriptions:** Every Supabase channel subscription (`supabase.channel().subscribe()`) must be cleaned up in a `useEffect` return cleanup block or inside a React component unmount event to prevent memory leaks:
    ```typescript
    useEffect(() => {
      const channel = supabase.channel('room-1').subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }, []);
    ```
*   **TanStack Query Error Boundaries:** Verify that all data-fetching hooks handle loading state (`isLoading`), error state (`isError`), and empty states gracefully, instead of assuming data is always present.
*   **Zod Safe Parsing:** When receiving external data or processing form values, use Zod's `.safeParse()` instead of `.parse()` if you want to handle failures gracefully without throwing unhandled exceptions.

---

## 4. Pre-Commit Review & Verification Script

Before marking a task as complete, perform this static code check:

1.  **Scan for Hardcoded Keys:** Run a quick regex search or grep search for keywords that commonly contain secrets:
    *   `sk-` (OpenAI or other LLM keys)
    *   `service_role` or `serviceRole`
    *   `password =` (excluding dummy database setup code in gitignore)
    *   `secret_`
2.  **Verify Git Status:** Verify that any local environment files created during debugging/testing are untracked and excluded from staging:
    ```bash
    git status
    ```
3.  **Run Build Verification:** Verify that typescript compile errors are caught before checking in code:
    ```bash
    npm run build
    ```
