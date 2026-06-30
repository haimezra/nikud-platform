-- =========================================
-- ניקוד★ – Supabase Database Schema
-- הרץ את זה ב-SQL Editor של Supabase
-- =========================================

-- SCHOOLS
create table schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  plan text default 'trial', -- trial | basic | pro
  plan_expires_at timestamptz,
  created_at timestamptz default now()
);

-- USERS (תלמידים, מורים, מנהלים)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('student','teacher','principal','admin')),
  school_id uuid references schools(id),
  class_name text,      -- רלוונטי לתלמידים בלבד
  points integer default 0,
  streak integer default 0,
  last_checkin date,
  avatar_color text default '#6C63FF',
  created_at timestamptz default now()
);

-- LESSONS (שיעורים)
create table lessons (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references users(id),
  school_id uuid references schools(id),
  class_name text not null,
  subject text not null,
  status text default 'active' check (status in ('active','completed','cancelled')),
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- POINT LOGS (יומן נקודות)
create table point_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references users(id),
  lesson_id uuid references lessons(id),
  points integer not null,
  reason text, -- 'attendance' | 'bonus' | 'task' | 'streak'
  note text,   -- הערת המורה
  created_at timestamptz default now()
);

-- STORE ITEMS (פרסים בחנות)
create table store_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  points_cost integer not null,
  icon text default '🎁',
  partner text,        -- שם השותף (סטימצקי, Steam וכו')
  commission_pct integer default 20,
  stock integer default 999,
  active boolean default true,
  created_at timestamptz default now()
);

-- PURCHASES (רכישות בחנות)
create table purchases (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references users(id),
  item_id uuid references store_items(id),
  points_spent integer not null,
  status text default 'pending' check (status in ('pending','approved','delivered','cancelled')),
  coupon_code text,
  created_at timestamptz default now()
);

-- SUBSCRIPTIONS (מנויי בתי ספר)
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id),
  plan text not null,  -- basic | pro | enterprise
  price_monthly integer,
  started_at timestamptz default now(),
  expires_at timestamptz,
  payment_ref text
);

-- =========================================
-- ROW LEVEL SECURITY (אבטחה)
-- =========================================

alter table users enable row level security;
alter table lessons enable row level security;
alter table point_logs enable row level security;
alter table store_items enable row level security;
alter table purchases enable row level security;

-- תלמיד רואה רק את עצמו
create policy "student_self" on users
  for select using (auth.uid() = id);

-- מורה רואה תלמידים מהבית ספר שלו
create policy "teacher_sees_school" on users
  for select using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
      and u.role = 'teacher'
      and u.school_id = users.school_id
    )
  );

-- מנהל רואה הכל בבית הספר שלו
create policy "principal_sees_all" on users
  for select using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
      and u.role in ('principal','admin')
      and u.school_id = users.school_id
    )
  );

-- תלמיד רואה נקודות שלו בלבד
create policy "student_own_logs" on point_logs
  for select using (student_id = auth.uid());

-- מורה רואה לוגים של השיעורים שלה
create policy "teacher_lesson_logs" on point_logs
  for select using (
    exists (
      select 1 from lessons l
      where l.id = point_logs.lesson_id
      and l.teacher_id = auth.uid()
    )
  );

-- =========================================
-- SEED DATA – פריטי חנות ראשוניים
-- =========================================

insert into store_items (name, description, points_cost, icon, partner) values
  ('קופון סטימצקי ₪30',    'קופון לרכישה בכל סניפי סטימצקי', 300,  '📚', 'סטימצקי'),
  ('גיפט-קארד Steam ₪25',  'לרכישת משחקים בחנות Steam',       250,  '🎮', 'Steam'),
  ('קפה חינם ב-Aroma',     'כוס קפה כלשהי בכל סניף ארומה',   150,  '☕', 'Aroma'),
  ('יום חופש מאושר',       'יום חופש אחד בתיאום עם בית הספר', 500, '🏖️', 'בית הספר'),
  ('פיצה Z פרסונל',        'פיצה אישית בכל רשת זוגלובק',      200,  '🍕', 'זוגלובק'),
  ('קופון YES ₪40',        'לסרטים וסדרות בYES VOD',           400,  '🎬', 'YES');

-- =========================================
-- FUNCTIONS – פונקציות עזר
-- =========================================

-- עדכון streak אוטומטי
create or replace function update_streak()
returns trigger as $$
begin
  if (select last_checkin from users where id = new.student_id) = current_date - 1 then
    update users set streak = streak + 1, last_checkin = current_date where id = new.student_id;
  elsif (select last_checkin from users where id = new.student_id) != current_date then
    update users set streak = 1, last_checkin = current_date where id = new.student_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_point_log_insert
  after insert on point_logs
  for each row execute function update_streak();
