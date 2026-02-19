import { createClient } from './client';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  displayName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * メールでサインアップ
 */
export async function signUp({ email, password, displayName }: SignUpData) {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || email.split('@')[0],
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * メールでログイン
 */
export async function signIn({ email, password }: SignInData) {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Google OAuth でログイン
 */
export async function signInWithGoogle() {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * ログアウト
 */
export async function signOut() {
  const supabase = createClient();
  
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * 現在のユーザーを取得
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  return user;
}

/**
 * 現在のセッションを取得
 */
export async function getSession(): Promise<Session | null> {
  const supabase = createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  return session;
}

/**
 * パスワードリセットメールを送信
 */
export async function resetPassword(email: string) {
  const supabase = createClient();
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * パスワードを更新
 */
export async function updatePassword(newPassword: string) {
  const supabase = createClient();
  
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * 認証状態の変化を監視
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  const supabase = createClient();
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  
  return subscription;
}
