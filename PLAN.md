# PLAN.md — Task Management System (Next.js + NestJS)

## Backend Choice

I chose NestJS because it provides a clean, scalable architecture using modules, guards, interceptors, and validation pipes. It enforces strong TypeScript patterns and makes it easier to implement structured security mechanisms such as JWT authentication, rate limiting, and DTO validation in a maintainable way. This improves long-term scalability and code readability during review.

---

## High-Level Architecture

### Frontend – Next.js

- Pages:
  - Register
  - Login
  - Dashboard (task list)
  - Create/Edit task form
- Handles loading & error states
- Client-side form validation and accessibility basics
- Route protection via Next.js middleware
- Authentication via HttpOnly cookies

---

### Backend – NestJS REST API

#### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`

#### Tasks

- `GET /tasks`
- `POST /tasks`
- `PUT /tasks/:id`
- `DELETE /tasks/:id`

- Authorization enforced via JWT Guard

---

## Data Storage

**MongoDB Atlas**

### Collections

- `users`
- `tasks` (includes `ownerId` reference)

- Indexed `ownerId` field for efficient filtering

---

## Request Flow

1. User logs in → credentials validated → backend issues access & refresh tokens.
2. Tokens stored in HttpOnly cookies.
3. Protected routes use JWT guard for validation.
4. All task queries are filtered using `ownerId` from JWT payload.
5. Ownership is verified for update/delete operations.

---

## Security Considerations

### Client (Next.js)

- Avoid `dangerouslySetInnerHTML` (XSS prevention)
- Tokens stored in HttpOnly cookies (not `localStorage`)
- SameSite cookies + CSRF protection for state-changing requests
- Basic Content Security Policy (CSP)
- Route redirection for unauthenticated users

---

### Server (NestJS)

- Password hashing (`bcrypt` / `argon2`)
- Rate limiting on login
- DTO validation + whitelist mode to block extra fields
- JWT validation on protected routes
- Ownership enforcement (`task.ownerId === user.id`)
- Safe error responses (no stack trace leaks)

---

## Scaling Considerations

- Stateless JWT allows horizontal scaling
- Database indexing on `ownerId`
- Redis could be added for rate limiting or refresh token storage
- API can be containerized (Docker) for cloud deployment
- Logging & monitoring can be added for production readiness
