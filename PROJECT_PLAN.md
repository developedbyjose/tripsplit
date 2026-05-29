# TripSplit — Product & Engineering Blueprint

## Overview
TripSplit is a collaborative barkada travel budgeting web app.

Core idea:
- Create Travel Spaces
- Invite friends via QR
- Track expenses collaboratively
- Compute debts automatically
- Full transparency through audit history
- Dashboard analytics for spending visibility

## Primary Stack

### Frontend
- React + TypeScript
- Vite
- TailwindCSS
- Shadcn UI
- TanStack Query
- React Hook Form
- Zod
- Recharts

### Backend / DB

Recommended:
- Supabase
- PostgreSQL

Why PostgreSQL?
- relational data
- aggregation
- settlement computation
- transactions
- dashboard analytics

## Core Features

### Travel Space

Example:

Zambales Outing 2026

Members:
- James
- Jose
- Gly
- 3 Others

Features:
- QR Join
- Realtime Collaboration
- Dashboard
- Settlement Summary

### Expense Tracking

Example:

James paid:
Tricycle Fare
₱1800

Split:
6 people

Result:
₱300 each

### Collaborative Editing

Every member can:
- Add expense
- Edit own expense
- View edits

Optional space setting:
Allow all members to edit all expenses.

### Transparency / Audit Log

Every expense stores:

- Created By
- Last Edited By
- Updated Time
- Change History

Example:

James created expense.

Jose edited:
1800 → 2000

Gly changed category.

## Roles

### Owner
- Delete space
- Manage members
- Lock space
- Toggle permissions

### Admin
- Manage expenses
- Generate invites

### Member
- Create expenses
- Edit own expenses

## Database Schema

### users

- id
- name
- email
- avatar_url
- created_at

### spaces

- id
- name
- description
- owner_id
- qr_enabled
- status
- created_at

### members

- id
- space_id
- user_id
- role
- joined_at

### expenses

- id
- space_id
- title
- amount
- category
- paid_by
- split_type
- created_by
- updated_by
- created_at
- updated_at

### expense_participants

- id
- expense_id
- member_id
- share_amount

### expense_history

- id
- expense_id
- field_name
- old_value
- new_value
- edited_by
- edited_at

### settlements

- id
- space_id
- debtor_id
- creditor_id
- amount
- status

### invites

- id
- space_id
- token
- expires_at

## Computation Logic

### Equal Split

Formula:

share = total_amount / participant_count

Example:

1800 / 6 = 300

### Balance Computation

Compute:
- total_paid
- total_owed

Formula:

balance = total_paid - total_owed

If positive:
User should receive money.

If negative:
User owes money.

## Dashboard Features

### KPI Cards

- Total Expenses
- My Balance
- Top Spender
- Remaining Debt

### Charts

- Expense by Category
- Spending Timeline
- Member Contribution
- Who Paid Most

### Activity Feed

Latest updates:

Jose edited Tricycle Fare.

Gly created BBQ expense.

## QR Join Flow

Owner creates space.

Generate invite token.

Generate QR.

Friend scans.

Join space instantly.

## Realtime Features

Supabase Realtime:

- live expense updates
- live activity feed
- instant dashboard refresh

## API Structure

POST /spaces
GET /spaces/:id
POST /expenses
PATCH /expenses/:id
GET /expenses/:id/history
POST /settlements/generate
POST /invites/create

## Folder Structure

src/

app/

components/

features/

dashboard/

expenses/

spaces/

settlements/

hooks/

services/

types/

utils/

## UI Pages

- Login
- Dashboard
- Create Space
- Join Space
- Expense List
- Expense Details
- Settlement Screen
- Analytics Dashboard
- Settings

## MVP Roadmap

Phase 1:
- Auth
- Space creation
- Expense CRUD
- Settlement compute

Phase 2:
- QR Join
- Dashboard
- Activity Feed

Phase 3:
- Realtime
- Audit Trail
- Permissions

Phase 4:
- Mobile Optimization
- Export Reports
- PWA

## Deployment

Frontend:
Vercel

Backend:
Supabase

Monitoring:
Sentry

Analytics:
PostHog

## Product Vision

TripSplit aims to become:

"Splitwise for Barkada Travel — collaborative, transparent, realtime."
