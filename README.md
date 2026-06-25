# SecureCover Insurance — Frontend

React + Vite frontend for the Insurance Policy Management backend.

## Setup

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

## Before you run it

Your Spring Boot backend must be running at `http://localhost:8080`.
`vite.config.js` proxies every `/api/*` request from the frontend straight
to it, so there's no CORS setup needed in dev.

If your backend runs on a different port, update the `target` in
`vite.config.js`:

```js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080', // change this if needed
      changeOrigin: true
    }
  }
}
```

## Logging in

Use the same accounts your backend already has (e.g. the seeded admin
user, or any customer you've registered + OTP-verified through the
`/api/auth` endpoints). Registration here will trigger a real OTP flow
against your backend exactly like Postman did.

## Validation

All forms validate client-side before hitting the backend, using shared
rules in `src/utils/validators.js`. Highlights:

- **Claim amount** is checked against the selected policy's actual coverage
  amount live in the form (the field is disabled until a policy is chosen,
  and shows the max claimable amount as a hint).
- **Incident date** can't be before the policy's start date, or in the future.
- **Payment amount** is no longer a free-text field - it's locked to exactly
  the policy's premium, read from the policy record, so a customer can't
  submit a partial payment as if it were full.
- **Plan creation** rejects a premium that's equal to or greater than the
  coverage it provides.
- Email, mobile number (10-digit Indian format), PIN code, password strength,
  and date-of-birth (18+, realistic range) all have dedicated checks.
- Destructive actions (cancel policy, delete document, deactivate
  product/plan) require a confirmation dialog.
- Backend validation errors are parsed back into per-field messages where
  possible (see `useFormErrors.js`), so a server-side rejection still shows
  up next to the right input instead of just a generic banner.

Note: this is frontend-only hardening. The backend remains the actual
source of truth for every rule - these checks exist to give immediate
feedback and reduce round trips, not to replace server-side validation.

## Project structure

See the chat where this was built for a full breakdown, or just look at
`src/` — it's organized as:

- `api/` — one file per backend resource, all using a shared axios instance
- `context/` + `hooks/` — auth state (`AuthContext`, `useAuth`), a reusable
  data-fetching hook (`useFetch`), and a form-error-handling hook (`useFormErrors`)
- `components/common/` — Button, Input, Select, Card, Alert, etc.
- `components/layout/` — Navbar, Sidebar, route protection
- `pages/auth/` — Login, Register (with email/phone OTP choice), Verify OTP
- `pages/customer/`, `pages/agent/`, `pages/admin/` — role-specific screens
- `utils/` — formatters, constants mirroring backend enums, and validators
- `styles/index.css` — the only stylesheet, plain CSS, no framework

## Build for production

```bash
npm run build
```

Output goes to `dist/`.
