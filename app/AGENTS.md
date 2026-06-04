<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:supabase-agent-rules -->
# Supabase SDK + Next.js Best Practices

## ⚠️ Security & Database Rules are ENFORCED
* Database triggers, foreign key constraints, column policies, and RLS (Row Level Security) are active.
* All write operations (INSERT, UPDATE, DELETE) must pass these rules.
* Always check for the appropriate database policies BEFORE writing/updating/deleting data.
* DO NOT assume you can write to any table without proper authorization.
* Use the official database migration files (`supabase/migrations/*.sql`) for schema changes.
* Always verify if a policy or migration already exists before creating a new one.

## 🔍 General Development
* Use `.env.local` (or equivalent) for sensitive environment variables.
* Check for existing Supabase migrations BEFORE creating new ones.
* Prefer client-side operations unless server-side logic is required.
* Use Supabase Auth for all user authentication flows.
* DO NOT expose Supabase secrets in client-side code or version control.

## 📝 TypeScript
* Always use proper type definitions for Supabase queries.
* Use `as` casts sparingly and only when necessary and type-safe.
* NEVER use `any` type for database results. Use proper TypeScript interfaces or generated types.

## ❌ Prohibited Actions
* Modifying schema via SQL strings (e.g., `CREATE TABLE ...`) on a production database.
* Bypassing Row Level Security.
* Hardcoding sensitive credentials in the codebase.
* Creating migrations that violate existing constraints or policies.

## 📚 Resources
* Use the official Supabase documentation for API usage.
* Refer to generated TypeScript types from `supabase/types.ts`.

# Supabase Best Practices

When interacting with Supabase from a Next.js application, follow these critical rules:

## 1. Security is Paramount
* **NEVER expose secrets:** Do not include Supabase URL, anon key, or service role key in client-side code. Use `process.env.NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `process.env.SUPABASE_SERVICE_ROLE_KEY` respectively.
* **Use RLS (Row Level Security):** Assume RLS is enabled on all tables. Your queries should respect these policies.
* **Use proper authorization:** Use the Supabase Client library for authentication. For server-side operations that require full permissions, use the `serviceRole` key.
* **Audit sensitive operations:** Critical write operations (e.g., user data modifications, financial transactions) should be audited and logged.

## 2. Database Migration Best Practices
* **Migration files are the single source of truth:** All schema changes must be managed through migration files in the `supabase/migrations/` directory.
* **Never write schema SQL directly to the database:** Do not use `CREATE TABLE`, `ALTER TABLE`, etc., directly against the Supabase database outside of a migration file.
* **Use `supabase gen types typescript`:** Always generate or update TypeScript types after making changes to the database schema. Store them in `supabase/types.ts` (or similar). This ensures type safety across your application.
* **Test migrations:** Test migrations in a local Supabase environment before applying them to production.
* **Handle migrations with care:** Migration files are executed automatically on deploy. Ensure they are backwards compatible and do not contain breaking changes unless explicitly intended and communicated.
* **Version control all migrations:** All migration files must be tracked in version control.

## 3. Coding Standards
* **Use the Supabase Client Library:** Use the official `@supabase/supabase-js` library for all interactions with Supabase. Do not use raw HTTP requests unless absolutely necessary and only after consulting documentation.
* **Prefer Client-Side Operations:** Most operations should happen client-side using the `supabase` client with a user session.
* **Server-Side Operations:** Use the `serviceRole` client for server-side operations (e.g., in Server Actions, API Routes, or middleware) that require elevated permissions. Be extremely careful with the service role key as it bypasses RLS.
* **Type Safety:** Use the generated TypeScript types from `supabase/types.ts` to ensure type safety in your queries and data models.
* **Error Handling:** Always handle errors returned by Supabase operations gracefully.
* **Avoid `any`:** Never use `any` for database results. Always define proper types.

## 4. Security Audit Points (Checklist)
Before committing code that interacts with Supabase, verify:
- [ ] Are sensitive secrets protected using environment variables?
- [ ] Are RLS policies in place for all tables that should be protected?
- [ ] Is the `serviceRole` key used only on the server and with caution?
- [ ] Are all database schema changes managed through migration files in `supabase/migrations/`?
- [ ] Have `supabase gen types typescript` been run after schema changes?
- [ ] Are TypeScript types being used for database results instead of `any`?
- [ ] Is proper error handling in place for Supabase operations?

<!-- END:supabase-agent-rules -->
