create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  email text not null default '',
  department text not null default 'Engineering',
  role text not null default 'employee',
  status text not null default 'pending_approval',
  approved_by uuid,
  approved_at timestamptz,
  rejection_reason text,
  phone text,
  location text,
  job_title text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
