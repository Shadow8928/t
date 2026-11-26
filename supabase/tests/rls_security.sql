-- SQL security smoke tests (run against local Supabase with pgTAP or manually).
-- Expectation: unauthenticated selects return zero rows; cross-user access denied.

-- As anon:
-- select count(*) from public.tasks;  -- 0

-- Create two users via Auth API in integration tests, then:
-- set request.jwt.claim.sub = '<user-a>';
-- insert/select own rows ok; user-b rows invisible.

select 'rls_security placeholder — execute with supabase test db when Docker available' as note;
