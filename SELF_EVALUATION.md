# Self-evaluation: Mini Helpdesk

## What I built

A fullstack helpdesk application in four days: a FastAPI + SQLAlchemy backend with JWT authentication, roles, ticket CRUD with soft delete, comments, filtering, search, pagination, centralized error handling and 11 automated tests, and a React frontend with protected routes, a ticket list with filters, a ticket detail page with comments and agent actions, and a create/edit form.

## What I learned

- **Python backend development.** My previous backend experience was ASP.NET Core with Entity Framework. I learned FastAPI and SQLAlchemy by mapping them to what I already knew (routers ≈ controllers, Session ≈ DbContext, Pydantic schemas ≈ DTOs, `Depends` ≈ dependency injection), and also where they differ (for example `db.refresh()` after commit, or explicit `foreign_keys` when a table has two relationships to the same table).
- **Authentication in depth.** Why passwords are hashed with a slow algorithm like bcrypt and what a salt does, how a JWT is signed and verified with HS256, why the secret never leaves the server, and why the algorithm must be whitelisted when decoding.
- **Designing permissions.** The difference between 401 and 403, checking agent-only actions at the endpoint level and mixed rules in the service, and returning 404 instead of 403 so other users' tickets aren't revealed.
- **Database details.** Indexes and their trade-offs, the N+1 query problem, soft delete, and SQLite specifics (foreign keys off by default, enum values not restricted without CHECK constraints).
- **Testing.** How fixtures and dependency overrides let tests use an in-memory database without changing application code.
- **Frontend patterns.** A single API client with consistent error handling, Context API for authentication, keeping filters in the URL, and handling loading, error and empty states (including ignoring late responses).

## What was most challenging

- **Getting started on a new stack under time pressure.** Setting up Python on a new machine (PATH problems, and choosing 3.13 because 3.15 lacked some packages) and understanding the project structure took longer than expected.
- **SQLAlchemy relationships.** The difference between foreign key columns and relationships, and why `Ticket` needs `foreign_keys` while `Comment` doesn't, took a few examples to really understand.
- **Understanding generated code, not just running it.** AI tools produced code quickly, but making sure I could explain every line took most of the time. I asked "why" about most parts before committing them.
- **React data loading.** Making the ticket list react to URL changes while avoiding race conditions was the hardest frontend part to understand.

## How I used AI

I used Claude to generate code step by step and to explain it, often by comparing it to .NET/EF Core. I tested every step manually in Swagger and the browser before committing, and noted in each PR what AI did and what I checked. During testing I found and fixed several issues, for example that users got 403 when re-sending an unchanged status/priority (which would break an edit form), a missing import, a deprecation warning in the test client, and a misleading message on closed tickets.

## What I would improve with more time

- Alembic migrations and PostgreSQL instead of `create_all` and SQLite
- Refresh tokens and rate limiting on login
- More tests (comments, filters, pagination) and frontend tests
- Docker Compose for a one-command setup
