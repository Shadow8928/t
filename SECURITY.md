# Security

## Secrets

- Never commit `.env`, service-role keys, or user tokens.
- Client apps use only the Supabase **anon** key with RLS.
- Edge Functions and admin scripts use the service role; keep them server-side.

## Data isolation

- All user-owned tables enable Row Level Security.
- Policies scope rows by `auth.uid()`.
- Timer exclusivity is enforced in PostgreSQL RPCs, not only in the client.

## Auth

- Email/password via Supabase Auth.
- Sessions stored securely (browser: Supabase client; iOS: Keychain).
- Account deletion removes owned data per cascade / soft-delete rules.

## Offline

- Pending sync ops are never silently discarded.
- Conflicts surface to the user; server version wins for authoritative fields where specified.

## Reporting

Report vulnerabilities privately to the repository owner; do not open public issues with exploit detail.
