# Leave Management System – Roadmap (Claude.md)

## 🎯 Goal

Build a maintainable, scalable SaaS Leave Management System (LMS) targeting a niche market with clear differentiation.

---

## 📌 Tech Stack

### Backend

- **Node.js + TypeScript** (runtime + type safety)
- **Next.js (API Routes)** or **NestJS** (if full separation needed)
- **PostgreSQL** with Prisma ORM (scalable, relational)
- **Redis** (caching, session store)
- **Docker** for containerization
- **Jest** / **Vitest** for testing

### Frontend

- **Next.js (React 18+)** with TypeScript
- **TailwindCSS** + **shadcn/ui** for UI components
- **TanStack Query** for server-state management
- **Zustand** for local state management

### DevOps

- **GitHub Actions** for CI/CD
- **Vercel** (frontend hosting) + **Railway / Render** (backend hosting)
- **Sentry** for monitoring & error tracking
- **Stripe** for payments

---

## 🧭 Development Roadmap

### Phase 1: Foundation (MVP)

- [ ] Project setup with linting, Prettier, commit hooks
- [ ] Auth (email + password, later add OAuth/SSO)
- [ ] Organization & user management (basic roles)
- [ ] Leave request + approval workflow
- [ ] Calendar view (team leaves)
- [ ] Basic reporting & CSV export
- [ ] Deploy MVP on Vercel/Render

### Phase 2: Differentiation Features

- [ ] Timezone-aware leave management
- [ ] Public holidays auto-detection (per country)
- [ ] Slack/Teams/Discord integration
- [ ] API-first support for dev teams
- [ ] Multi-language support

### Phase 3: Scale

- [ ] Subscription plans (Stripe)
- [ ] Advanced reporting & analytics
- [ ] Admin dashboards (per org)
- [ ] Mobile app (React Native / Expo)
- [ ] Marketplace integrations (HR, payroll)

---

## 🧑‍💻 Coding Rules

### General

- Follow SOLID principles and DRY (Don’t Repeat Yourself).
- Always use TypeScript strict mode ("strict": true in tsconfig).
- No any unless absolutely unavoidable (and document why).
- Always define function return types explicitly.
- Use interfaces for contracts, types for unions/utility types.
- Validate all external input with Zod or similar schema validators.
- Use DTOs for API payloads and ensure strong typing between frontend & backend.
- Prefer async/await over .then().catch().
- Catch and normalize errors at service boundaries using a centralized error handler.
- Never expose internal error details to clients (only safe messages).
- Use environment variables for all secrets and never commit them to git.
- Use config files instead of magic constants scattered in code.
- Add unit tests for business logic and integration tests for API/database.
- Keep functions pure when possible (no hidden side effects).
- Maximum function length: 30–40 lines (split logic otherwise).
- Write self-documenting code; add JSDoc only where logic is non-obvious.
- Use ESLint + Prettier with project-wide rules.
- Prefer composition over inheritance.
- Avoid circular dependencies (organize modules cleanly).
- Follow REST best practices for APIs (consistent status codes, verbs, error formats).
- Commit messages follow Conventional Commits (feat:, fix:, chore: etc.).
- Every new feature must include tests + docs in the PR.
- Keep dependencies updated; remove unused ones regularly.
- Never block the event loop with expensive operations (use workers/queues).
- Always write migration scripts for database changes (Prisma Migrate).
- Use feature flags for risky or staged rollouts.
- Security first: sanitize inputs, escape outputs, prevent SQL injection/XSS.
- Review PRs for readability, not cleverness — code must be simple and clear.
- Use nextjs inbuilt component like Link or Image.
- Code in such a way that it does not make everything client side, only use client side when needed
- use lazy loading, dynamic imports and code splitting to keep the application performance as high as possible but do not over optimize it. Dynamic imports will only be for large components or modals such as Dialog or Alert.
- Never use anything that is not imported or leave anything that is not used.
- Use proper <Skeleton /> component from shadcn to show loading states for loading something. and use Spinner to show loading when you press a button
- Do not use ssr in server components to avoid "`ssr: false` is not allowed with `next/dynamic` in Server Components. Please move it into a Client Component".
- Always use Form component of shadcn for forms
- Always use React Query with axios for api calls
- Create proper axios instance with interceptors
- Never use console, always use logger service

### Naming Conventions

- **Files**: kebab-case (`leave-request.service.ts`).
- **Classes**: PascalCase (`LeaveRequestService`).
- **Functions/variables**: camelCase (`getLeaveRequests`).
- **Constants**: UPPER_CASE (`MAX_LEAVE_DAYS`).

### TypeScript Rules

- Always use **interfaces** for object shapes.
- Prefer **Enums or union types** over raw strings.
- Use **DTOs** for API input/output validation.
- Add **return types** to all functions (no implicit `any`).

### Git Rules

- Feature branches → `feature/<name>`
- Bugfix branches → `fix/<name>`
- Commits follow **Conventional Commits** (feat, fix, chore, docs).

---

## ⚡ Error Handling

Centralized error handling with a reusable `AppError` class.

```ts
// src/utils/AppError.ts

export interface NormalizedError {
  statusCode: number;
  message: string;
  details?: any;
}

export class AppError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode = 500, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  static from(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof SyntaxError) {
      return new AppError("Invalid JSON or syntax error", 400, {
        original: error.message,
      });
    }

    if (error instanceof TypeError) {
      return new AppError("Type error occurred", 400, {
        original: error.message,
      });
    }

    if (error instanceof Error) {
      if (error.name.includes("Prisma") || error.name.includes("Sequelize")) {
        return new AppError("Database error", 500, { original: error.message });
      }
      return new AppError(error.message, 500);
    }

    return new AppError("Unknown error", 500, { original: error });
  }
}
```

Usage:

```ts
try {
  // some DB call
} catch (err) {
  const appError = AppError.from(err);
  console.error(appError);
  res.status(appError.statusCode).json({ message: appError.message });
}
```

---

✅ This way all errors across the stack are normalized, logged, and consistently returned to the client.
