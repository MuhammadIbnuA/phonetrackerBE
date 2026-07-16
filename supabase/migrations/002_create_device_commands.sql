create extension if not exists pgcrypto;

create table if not exists public.device_commands (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  command_type text not null check (command_type in ('ring', 'message')),
  title text,
  body text,
  duration_seconds integer,
  payload jsonb,
  status text not null default 'pending' check (status in ('pending', 'sent', 'executed', 'failed')),
  sent_at timestamptz,
  executed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists device_commands_device_status_created_idx
  on public.device_commands(device_id, status, created_at asc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists device_commands_set_updated_at on public.device_commands;
create trigger device_commands_set_updated_at
before update on public.device_commands
for each row execute function public.set_updated_at();
