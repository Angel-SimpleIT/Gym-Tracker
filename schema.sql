-- SCHEMA: Gym-Tracker
-- Phase 1: Robust Foundation for Zero Friction UX and WhatsApp Integration

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE task_type AS ENUM ('meal', 'workout');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLES
-- Profiles: Extended user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  full_name TEXT,
  phone_number TEXT UNIQUE,
  avatar_url TEXT
);

-- Daily Tasks: Unified feed for meals and workouts
CREATE TABLE IF NOT EXISTS public.daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  task_type task_type NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEXES (Optimization for Glance & Go)
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON public.daily_tasks (user_id, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_tasks_is_completed ON public.daily_tasks (is_completed);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DO $$ BEGIN
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Daily Tasks Policies
DO $$ BEGIN
    CREATE POLICY "Users can view own tasks" ON public.daily_tasks FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own tasks" ON public.daily_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own tasks" ON public.daily_tasks FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete own tasks" ON public.daily_tasks FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 5. TRIGGERS & FUNCTIONS
-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.phone
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
