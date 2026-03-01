# Deployment Guide

## Prerequisites

- Supabase project: `ucznyddkynebsssltjru`
- Railway account with a project created
- Resend account with verified sending domain
- Domain DNS access (for Resend domain verification)

## 1. Database (Supabase)

### Apply Schema

Schema is managed via Supabase CLI migrations.

```bash
# Install CLI
brew install supabase/tap/supabase

# Link to project (requires database password)
supabase link --project-ref ucznyddkynebsssltjru

# Apply migrations
supabase db push

# Apply seed data (via psql)
psql "<your-connection-string>" -f supabase/seed.sql
```

### Future Schema Changes

```bash
# Create a new migration
supabase migration new <description>

# Edit the migration file in supabase/migrations/

# Apply to remote
supabase db push
```

## 2. Auth Configuration (Supabase Dashboard)

Go to: https://supabase.com/dashboard/project/ucznyddkynebsssltjru/auth

### Providers
- Enable **Email** provider
- Set to **OTP / Magic Link** mode (not password)
- Disable all other providers unless needed

### Email Templates
- Customize the OTP email subject and body
- Replace "Supabase" branding with "Rydeen Dealer Portal"
- Template variables: `{{ .Token }}` for the 6-digit code

### URL Configuration
- **Site URL:** `https://your-production-domain.com`
- **Redirect URLs:** Add your production domain

### Rate Limits
- Review email send rate (default: 2 per hour on free tier)
- Consider upgrading Supabase plan if higher limits needed

## 3. Email (Resend)

### Domain Verification
1. Log into https://resend.com
2. Go to Domains > Add Domain
3. Enter your sending domain (e.g., `rydeenmobile.com`)
4. Add the DNS records Resend provides:
   - MX record
   - SPF (TXT record)
   - DKIM (TXT records)
5. Wait for verification (usually minutes, can take up to 48h)

### API Key
1. Go to API Keys > Create API Key
2. Name it "Dealer Portal Production"
3. Copy the key and set it as `RESEND_API_KEY` env var

### Sender Address
The app sends from `noreply@rydeenmobile.com`. This must match your verified domain.

## 4. Railway Deployment

### Create Service
1. Log into Railway
2. Create new project or add service to existing project
3. Connect your GitHub repository
4. Set root directory to `/` (default)

### Environment Variables
Set these in Railway service settings > Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ucznyddkynebsssltjru.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase > Settings > API (keep secret) |
| `RESEND_API_KEY` | From Resend dashboard |
| `ORDER_NOTIFICATION_EMAIL` | `orders@rydeenmobile.com` |
| `NEXT_PUBLIC_SITE_URL` | Your Railway domain or custom domain |

### Build & Deploy
Railway auto-detects Next.js. Default settings should work:
- Build command: `npm run build`
- Start command: `npm run start`

### Custom Domain (Optional)
1. In Railway service > Settings > Domains
2. Add custom domain
3. Configure DNS CNAME to point to Railway

## 5. Post-Deployment Checklist

- [ ] Database schema applied (all 8 tables present)
- [ ] Seed data loaded (pricing tiers, categories, products)
- [ ] RLS policies active on all tables
- [ ] Auth email OTP working (test signup flow)
- [ ] Order notification email sending (test order placement)
- [ ] `NEXT_PUBLIC_SITE_URL` matches actual domain
- [ ] Supabase automatic backups enabled (check plan)
- [ ] Error monitoring in place (Railway logs + Supabase logs)
