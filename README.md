# SchoolMarks Client

React 18 + Vite + Tailwind CSS v4 frontend for SchoolMarks.
Pairs with the `schoolmarks-api` Rails backend.

## Setup

```bash
npm install
cp .env.example .env    # point VITE_API_URL at your running API
npm run dev              # http://localhost:5173
```

## Structure

- `src/api/client.js` — axios instance; attaches JWT, redirects to `/login` on 401.
- `src/context/AuthContext.jsx` — login/logout, current user, `isAdmin` flag.
- `src/pages/Login.jsx` — sign in.
- `src/pages/MyClasses.jsx` — teacher landing page: assigned subjects/grades → assessments.
- `src/pages/MarkEntryGrid.jsx` — the core screen: fast, keyboard-friendly grid for entering marks per assessment. Submitted rows lock (edits go through the edit-request/approval flow on the backend).
- `src/pages/Dashboard.jsx` — admin view: submission status per assessment, with one-click `.xlsx` export.

## What's built vs. what's next

**Built:** auth flow, teacher mark-entry grid (the main pain point this project solves), admin submission-status dashboard with Excel export.

**Not yet built (next phase):** admin screens for managing grades/subjects/students/teacher assignments (currently API-only — use Postman or a Rails console/seed for initial setup), the edit-request UI for teachers, Excel/CSV template upload as a secondary entry method.
# schoolmarks-client
