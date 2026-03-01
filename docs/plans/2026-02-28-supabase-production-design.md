# Supabase Production Go-Live Design

**Date:** 2026-02-28
**Status:** Approved

## Context

Rydeen Dealer Portal needs to go live with Supabase as the production database. The existing Supabase project (`ucznyddkynebsssltjru.supabase.co`) will serve as production. The database is currently empty — schema needs to be applied. The Next.js app will deploy to Railway.

## Decisions

- **Approach:** Supabase CLI with versioned migrations (not raw SQL)
- **Auth emails:** Supabase built-in for now, custom SMTP later
- **Hosting:** Railway for the Next.js app
- **Email (orders):** Resend — account exists, domain verification needed

## Section 1: Supabase CLI & Migration Setup

- Install Supabase CLI (`brew install supabase/tap/supabase`)
- Run `supabase init` to create `supabase/config.toml`
- Link to production project: `supabase link --project-ref ucznyddkynebsssltjru`
- Move `schema.sql` into `supabase/migrations/20260228000000_initial_schema.sql`
- Remove original `supabase/schema.sql`
- Keep `supabase/seed.sql` in place
- Apply with `supabase db push`

## Section 2: Auth Configuration

Dashboard settings to configure:
- Auth > Providers: Email enabled with OTP (magic link/code), not password-based
- Auth > Email Templates: Customize branding to "Rydeen Dealer Portal"
- Auth > URL Configuration: Set Site URL to production domain, add redirect URLs
- Auth > Rate Limits: Review defaults for production plan tier

No code changes needed — auth implementation is correct.

## Section 3: Environment Variables & Railway

Required env vars for Railway:

| Variable | Public | Notes |
|----------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | RLS-protected anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Server-only admin key |
| `RESEND_API_KEY` | No | After domain verification |
| `ORDER_NOTIFICATION_EMAIL` | No | `orders@rydeenmobile.com` |
| `NEXT_PUBLIC_SITE_URL` | Yes | Production URL |

Deliverables:
- `.env.production.example` documenting all variables
- `docs/deployment.md` with Railway setup steps

## Section 4: Email, RLS Verification & Production Checklist

**Resend setup:**
- Add sending domain in Resend dashboard
- Configure DNS records (MX, SPF, DKIM)
- Verify domain, create API key

**RLS verification:**
- Script to test all RLS policies after schema is applied
- Verify dealer isolation, admin access, catalog visibility

**Production checklist doc:**
- Database: schema, seed data, RLS
- Auth: OTP, templates, URLs
- Email: Resend verified
- Env vars: all set on Railway
- Backups: Supabase automatic backups
- Monitoring: dashboard logs
