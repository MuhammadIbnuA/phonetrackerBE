create table if not exists public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_type text not null check (transaction_type in ('income', 'expense')),
  amount numeric(14,2) not null check (amount > 0),
  category text not null,
  description text,
  transaction_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_assets (
  id uuid primary key default gen_random_uuid(),
  asset_name text not null,
  asset_type text not null,
  last_service_date date,
  next_service_date date,
  maintenance_cost numeric(14,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_repairs (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.service_assets(id) on delete cascade,
  title text not null,
  description text,
  repair_date date not null default current_date,
  cost numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.alarms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  alarm_mode text not null check (alarm_mode in ('once', 'daily')),
  scheduled_at timestamptz,
  alarm_time time,
  timezone text not null default 'Asia/Jakarta',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((alarm_mode = 'once' and scheduled_at is not null) or (alarm_mode = 'daily' and alarm_time is not null))
);

create table if not exists public.alarm_deliveries (
  id uuid primary key default gen_random_uuid(),
  alarm_id uuid not null references public.alarms(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  occurrence_key text not null,
  created_at timestamptz not null default now(),
  unique (alarm_id, device_id, occurrence_key)
);

create index if not exists finance_transactions_date_idx on public.finance_transactions(transaction_date desc);
create index if not exists service_assets_next_service_idx on public.service_assets(next_service_date);
create index if not exists alarms_enabled_idx on public.alarms(enabled, scheduled_at, alarm_time);

drop trigger if exists finance_transactions_set_updated_at on public.finance_transactions;
create trigger finance_transactions_set_updated_at before update on public.finance_transactions for each row execute function public.set_updated_at();
drop trigger if exists service_assets_set_updated_at on public.service_assets;
create trigger service_assets_set_updated_at before update on public.service_assets for each row execute function public.set_updated_at();
drop trigger if exists alarms_set_updated_at on public.alarms;
create trigger alarms_set_updated_at before update on public.alarms for each row execute function public.set_updated_at();
