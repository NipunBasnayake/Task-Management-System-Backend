# PLAN.md — Task Management System (Next.js + NestJS)

## Backend choice
I’m choosing **NestJS** because it gives a clean, scalable structure out of the box (modules, guards, validation pipes), strong **TypeScript** patterns, and makes it easy to implement security requirements like **JWT validation, rate limiting, and input validation** in a consistent way. It’s also easier to explain and maintain during a code review than a “single file” Express setup.

## High-level architecture
- **Frontend:** Next.js
  - Pages: Register, Login, Dashboard (tasks list), Create/Edit task form
  - Handles loading + error states, form validation UX, and basic accessibility
  - Route protection using Next middleware + server-side checks where needed
- **Backend:** NestJS REST API
  - Auth: `/auth/register`, `/auth/login`, `/auth/refresh`
  - Tasks: `/tasks` CRUD (only the owner can access/modify)
- **Data storage**
  - The assessment doesn’t mention a DB, but a task system needs persistence.
  - I’ll use **MongoDB Atlas** for fast setup and simple deployment.
  - Collections: `users` and `tasks` (each task has an `ownerId`).

## Security considerations (what I will actively protect)
### Client (Next.js)
- **XSS prevention:** avoid `dangerouslySetInnerHTML`, escape output by default, validate inputs.
- **Secure auth storage:** store tokens in **HttpOnly cookies** (not localStorage).
- **CSRF protection:** use **SameSite cookies** and a CSRF token (double-submit) for POST/PUT/DELETE if needed.
- **CSP:** add a basic **Content-Security-Policy** header to reduce XSS risk.
- **Route protection:** redirect unauthenticated users away from dashboard/task pages.

### Server (NestJS)
- **Password hashing:** bcrypt/argon2 on registration.
- **Rate limiting:** throttle login endpoint to slow brute force attacks.
- **Validation & sanitization:** DTO validation (`class-validator`) + whitelist to block extra fields.
- **JWT/session validation:** verify access token on every protected route; refresh route issues new access token.
- **Authorization:** enforce ownership (`task.ownerId === user.id`) for read/update/delete.
- **Safe error handling:** consistent errors, no stack traces or internal leaks in responses.

## Optional novelty feature
Add **task filters + sorting** (e.g., status and due date) with query params (`GET /tasks?status=...`) and a small UI filter on the dashboard—useful, realistic, and doesn’t risk the core requirements.
