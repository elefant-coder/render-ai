import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * ブラウザ用 Supabase クライアント
 * クライアントサイドで使用
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * シングルトンインスタンス（クライアントコンポーネント用）
 */
let browserClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}
