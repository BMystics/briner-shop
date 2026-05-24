-- ============================================================
-- Briner Shop - סכמת בסיס הנתונים
-- ============================================================
-- הוראות הרצה:
-- 1. כנס ל-https://supabase.com/dashboard/project/_/sql/new
-- 2. הדבק את כל הקובץ והרץ
-- 3. הסכמה תיווצר עם RLS (Row Level Security) מופעל
-- ============================================================

-- הרחבה ליצירת UUID
create extension if not exists "pgcrypto";

-- ============== PRODUCTS ==============
create table if not exists public.products (
  id                uuid primary key default gen_random_uuid(),
  handle            text unique not null,           -- slug ל-URL: "pla-red"
  sku               text unique,                    -- מק"ט פנימי
  name              text not null,
  description       text,
  type              text not null,                  -- pla, silk, petg, abs, tpu
  color             text,
  color_hex         text,                           -- "#FF0000" לתצוגת swatch
  weight_grams      int default 1000,
  diameter          text default '1.75mm',
  price             numeric(10,2) not null check (price >= 0),
  compare_at_price  numeric(10,2),                  -- מחיר לפני הנחה (אופציונלי)
  stock             int default 0 check (stock >= 0),
  image_url         text,
  gallery_urls      text[],                         -- מערך תמונות נוספות
  badge             text,                           -- "חדש" / "פופולרי" / "מבצע"
  is_active         boolean default true,           -- האם מוצג בחנות
  is_featured       boolean default false,          -- מודגש בדף הבית
  sort_order        int default 0,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists products_handle_idx  on public.products (handle);
create index if not exists products_type_idx    on public.products (type) where is_active = true;
create index if not exists products_active_idx  on public.products (is_active);

-- ============== CUSTOMERS ==============
create table if not exists public.customers (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  full_name   text,
  phone       text,
  created_at  timestamptz default now()
);

create index if not exists customers_email_idx on public.customers (email);

-- ============== ORDERS ==============
create table if not exists public.orders (
  id                       uuid primary key default gen_random_uuid(),
  order_number             text unique not null,                 -- BRN-2026-0001
  customer_id              uuid references public.customers(id) on delete set null,
  customer_email           text not null,
  customer_name            text,
  customer_phone           text,
  status                   text not null default 'pending'
                             check (status in ('pending','paid','processing','shipped','delivered','cancelled','refunded')),
  payment_status           text not null default 'pending'
                             check (payment_status in ('pending','paid','failed','refunded')),
  subtotal                 numeric(10,2) not null default 0,
  shipping                 numeric(10,2) not null default 0,
  tax                      numeric(10,2) not null default 0,     -- מע"מ
  total                    numeric(10,2) not null default 0,
  shipping_address         jsonb,                                -- {street, city, zip, country}
  notes                    text,                                 -- הערות לקוח
  payplus_transaction_uid  text,                                 -- מזהה עסקה ב-PayPlus
  payplus_page_uid         text,                                 -- מזהה דף תשלום ב-PayPlus
  paid_at                  timestamptz,
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

create index if not exists orders_status_idx   on public.orders (status);
create index if not exists orders_customer_idx on public.orders (customer_id);
create index if not exists orders_created_idx  on public.orders (created_at desc);
create index if not exists orders_number_idx   on public.orders (order_number);

-- ============== ORDER ITEMS ==============
-- שורות בודדות בתוך הזמנה. שומרים snapshot של שם/מחיר כי המוצר עלול להשתנות.
create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  product_id    uuid references public.products(id) on delete set null,
  product_name  text not null,
  product_sku   text,
  unit_price    numeric(10,2) not null,
  quantity      int not null check (quantity > 0),
  line_total    numeric(10,2) not null,
  created_at    timestamptz default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- ============== updated_at TRIGGER ==============
-- מעדכן אוטומטית את updated_at בכל UPDATE
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists products_touch on public.products;
create trigger products_touch
  before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch
  before update on public.orders
  for each row execute function public.touch_updated_at();

-- ============== ORDER NUMBER SEQUENCE ==============
-- רצף מספרי הזמנה ידידותי: BRN-2026-0001, BRN-2026-0002 ...
create sequence if not exists public.order_number_seq start 1;

create or replace function public.generate_order_number()
returns text language plpgsql as $$
declare
  yr text := to_char(now(), 'YYYY');
  n  int  := nextval('public.order_number_seq');
begin
  return 'BRN-' || yr || '-' || lpad(n::text, 4, '0');
end
$$;

-- ============== ROW LEVEL SECURITY ==============
-- ה-server שלנו ניגש עם service_role key שעוקף RLS.
-- ה-RLS פה הוא רק שכבת הגנה למקרה שמישהו ינסה לקרוא עם anon key.

alter table public.products    enable row level security;
alter table public.customers   enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- ציבורי יכול לקרוא רק מוצרים פעילים
drop policy if exists "public read active products" on public.products;
create policy "public read active products"
  on public.products for select
  using (is_active = true);

-- aucun policy על customers/orders/order_items → אף אחד מבחוץ לא ניגש.
-- השרת שלנו (service_role) עוקף RLS אוטומטית.
