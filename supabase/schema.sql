-- ============================================
-- render-ai Database Schema
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM Types
-- ============================================

-- プランタイプ
CREATE TYPE plan_type AS ENUM ('free', 'pro', 'business');

-- 生成ステータス
CREATE TYPE generation_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- ============================================
-- Users Table
-- ============================================
-- Supabase Auth (auth.users) と連携するユーザープロファイル

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  plan plan_type NOT NULL DEFAULT 'free',
  credits INTEGER NOT NULL DEFAULT 10,
  monthly_generations INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_plan ON users(plan);

-- RLS (Row Level Security) 有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ポリシー: ユーザーは自分のデータのみ参照・更新可能
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- Generations Table
-- ============================================
-- 画像生成の履歴

CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status generation_status NOT NULL DEFAULT 'pending',
  prompt TEXT NOT NULL,
  parameters JSONB NOT NULL,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  model_used TEXT NOT NULL,
  generation_time_ms INTEGER,
  error_message TEXT,
  credits_used INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_generations_user_id ON generations(user_id);
CREATE INDEX idx_generations_status ON generations(status);
CREATE INDEX idx_generations_created_at ON generations(created_at DESC);
CREATE INDEX idx_generations_model_used ON generations(model_used);

-- RLS 有効化
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- ポリシー: ユーザーは自分の生成履歴のみ参照・作成可能
CREATE POLICY "Users can view own generations"
  ON generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations"
  ON generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generations"
  ON generations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own generations"
  ON generations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Favorites Table
-- ============================================
-- お気に入り画像

CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  generation_id UUID NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
  image_index INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 同じ generation_id + image_index の組み合わせは1ユーザーにつき1つまで
  UNIQUE(user_id, generation_id, image_index)
);

-- インデックス
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_generation_id ON favorites(generation_id);
CREATE INDEX idx_favorites_created_at ON favorites(created_at DESC);

-- RLS 有効化
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- ポリシー
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own favorites"
  ON favorites FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- Functions
-- ============================================

-- クレジット減算
CREATE OR REPLACE FUNCTION decrement_credits(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  UPDATE users
  SET credits = credits - p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
    AND credits >= p_amount
  RETURNING credits INTO current_credits;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  RETURN current_credits;
END;
$$;

-- 月間生成数インクリメント
CREATE OR REPLACE FUNCTION increment_monthly_generations(
  p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE users
  SET monthly_generations = monthly_generations + 1,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING monthly_generations INTO new_count;
  
  RETURN new_count;
END;
$$;

-- ============================================
-- Triggers
-- ============================================

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER generations_updated_at
  BEFORE UPDATE ON generations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Auth Trigger: 新規ユーザー作成時にprofileを自動作成
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 月次クレジットリセット (Cron Job用)
-- Supabase Dashboard の pg_cron で設定
-- ============================================

-- 毎月1日にmonthly_generationsをリセットし、freeユーザーのクレジットを10に戻す
-- SELECT cron.schedule('reset-monthly', '0 0 1 * *', $$
--   UPDATE users 
--   SET monthly_generations = 0,
--       credits = CASE WHEN plan = 'free' THEN 10 ELSE credits END
--   WHERE true;
-- $$);
