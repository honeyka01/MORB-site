-- CAQT / SARKTIS — Supabase RLS admin setup
-- Run in Supabase SQL Editor.
-- Then replace YOUR-AUTH-USER-UUID with the UUID of the admin user
-- from Authentication -> Users.

create table if not exists public.admin_users (
    user_id uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

revoke all on table public.admin_users from anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.admin_users
        where user_id = auth.uid()
    );
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.anomaly enable row level security;
alter table public.para enable row level security;
alter table public.staff enable row level security;
alter table public.prot enable row level security;

drop policy if exists "public_read_anomaly" on public.anomaly;
create policy "public_read_anomaly"
on public.anomaly for select
to anon, authenticated
using (true);

drop policy if exists "admin_insert_anomaly" on public.anomaly;
create policy "admin_insert_anomaly"
on public.anomaly for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admin_update_anomaly" on public.anomaly;
create policy "admin_update_anomaly"
on public.anomaly for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin_delete_anomaly" on public.anomaly;
create policy "admin_delete_anomaly"
on public.anomaly for delete
to authenticated
using (public.is_admin());

drop policy if exists "public_read_para" on public.para;
create policy "public_read_para"
on public.para for select
to anon, authenticated
using (true);

drop policy if exists "admin_insert_para" on public.para;
create policy "admin_insert_para"
on public.para for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admin_update_para" on public.para;
create policy "admin_update_para"
on public.para for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin_delete_para" on public.para;
create policy "admin_delete_para"
on public.para for delete
to authenticated
using (public.is_admin());

drop policy if exists "public_read_staff" on public.staff;
create policy "public_read_staff"
on public.staff for select
to anon, authenticated
using (true);

drop policy if exists "admin_insert_staff" on public.staff;
create policy "admin_insert_staff"
on public.staff for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admin_update_staff" on public.staff;
create policy "admin_update_staff"
on public.staff for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin_delete_staff" on public.staff;
create policy "admin_delete_staff"
on public.staff for delete
to authenticated
using (public.is_admin());

drop policy if exists "public_read_prot" on public.prot;
create policy "public_read_prot"
on public.prot for select
to anon, authenticated
using (true);

drop policy if exists "admin_insert_prot" on public.prot;
create policy "admin_insert_prot"
on public.prot for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admin_update_prot" on public.prot;
create policy "admin_update_prot"
on public.prot for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin_delete_prot" on public.prot;
create policy "admin_delete_prot"
on public.prot for delete
to authenticated
using (public.is_admin());

-- After creating/logging into the intended admin account:
-- insert into public.admin_users (user_id)
-- values ('YOUR-AUTH-USER-UUID')
-- on conflict (user_id) do nothing;
