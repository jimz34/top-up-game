
-- ROLES
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users view own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  referral_code text unique,
  referred_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Profiles viewable by owner or admin" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Users update own profile" on public.profiles for update to authenticated
  using (id = auth.uid());
create policy "Admins update any profile" on public.profiles for update to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- WALLETS
create table public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance numeric(14,2) not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.wallets enable row level security;
create policy "Users view own wallet" on public.wallets for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage wallets" on public.wallets for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.wallet_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(14,2) not null,
  type text not null, -- deposit, deduction, cashback, referral, refund
  description text,
  balance_after numeric(14,2) not null,
  created_at timestamptz not null default now()
);
alter table public.wallet_history enable row level security;
create policy "Users view own history" on public.wallet_history for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- GAMES
create table public.games (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  publisher text,
  image_url text,
  category text,
  is_popular boolean not null default false,
  is_active boolean not null default true,
  requires_server_id boolean not null default false,
  user_id_label text not null default 'User ID',
  created_at timestamptz not null default now()
);
alter table public.games enable row level security;
create policy "Games public read" on public.games for select using (is_active = true or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage games" on public.games for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- PRODUCTS
create table public.products (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  name text not null,
  sku text,
  price numeric(14,2) not null,
  cost numeric(14,2) not null default 0,
  profit_margin numeric(14,2) generated always as (price - cost) stored,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.products enable row level security;
create policy "Products public read" on public.products for select using (is_active = true or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage products" on public.products for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- TRANSACTIONS
create type public.tx_status as enum ('pending','paid','processing','success','failed','cancelled','refunded');

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  order_id text unique not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null references public.games(id),
  product_id uuid not null references public.products(id),
  user_game_id text not null,
  server_id text,
  amount numeric(14,2) not null,
  cost numeric(14,2) not null default 0,
  profit numeric(14,2) not null default 0,
  payment_method text not null,
  status tx_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.transactions enable row level security;
create policy "Users view own transactions" on public.transactions for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Users insert own transactions" on public.transactions for insert to authenticated
  with check (user_id = auth.uid());
create policy "Admins manage transactions" on public.transactions for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create index idx_tx_user on public.transactions(user_id, created_at desc);
create index idx_tx_status on public.transactions(status);

-- TRIGGER: on signup, create profile, wallet, and default user role
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, referral_code)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)),
          upper(substr(md5(new.id::text),1,8)));
  insert into public.wallets (user_id, balance) values (new.id, 0);
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users for each row execute function public.handle_new_user();

-- Updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger tx_touch before update on public.transactions
  for each row execute function public.touch_updated_at();
create trigger profile_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
