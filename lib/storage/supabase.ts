/**
 * Supabase Storage Client
 * R2の代わりにSupabase Storageを使用
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase クライアントの初期化
function createSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// シングルトンインスタンス
let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    supabaseAdmin = createSupabaseAdmin();
  }
  return supabaseAdmin;
}

// バケット名
const BUCKET_NAME = 'images';

/**
 * 画像をSupabase Storageにアップロード
 * 
 * @param buffer - 画像のバイナリデータ
 * @param path - ストレージ上のパス
 * @param contentType - MIMEタイプ
 * @returns アップロードされた画像のURL
 */
export async function uploadImage(
  buffer: Buffer,
  path: string,
  contentType: string = 'image/png'
): Promise<string> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, buffer, {
      contentType,
      cacheControl: '31536000', // 1年キャッシュ
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // パブリックURLを取得
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Base64画像をSupabase Storageにアップロード
 */
export async function uploadBase64Image(
  base64Data: string,
  path: string
): Promise<string> {
  // data:image/png;base64,... 形式から Base64 部分を抽出
  const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
  
  let contentType = 'image/png';
  let base64Content = base64Data;
  
  if (matches) {
    contentType = matches[1];
    base64Content = matches[2];
  }
  
  const buffer = Buffer.from(base64Content, 'base64');
  return uploadImage(buffer, path, contentType);
}

/**
 * 生成画像を保存
 * 
 * @param generationId - 生成ID
 * @param images - Base64エンコードされた画像配列
 * @returns アップロードされた画像URLの配列
 */
export async function saveGeneratedImages(
  generationId: string,
  images: string[]
): Promise<{ url: string; thumbnailUrl: string }[]> {
  const results: { url: string; thumbnailUrl: string }[] = [];
  
  for (let i = 0; i < images.length; i++) {
    const base64Data = images[i];
    const path = `generations/${generationId}/${i}.png`;
    const thumbnailPath = `generations/${generationId}/${i}_thumb.png`;
    
    // オリジナル画像をアップロード
    const url = await uploadBase64Image(base64Data, path);
    
    // サムネイルは同じ画像を使用（本番では縮小処理を追加）
    // TODO: Sharp等でサムネイル生成
    const thumbnailUrl = await uploadBase64Image(base64Data, thumbnailPath);
    
    results.push({ url, thumbnailUrl });
  }
  
  return results;
}

/**
 * 画像のパブリックURLを取得
 */
export async function getImageUrl(path: string): Promise<string> {
  const supabase = getSupabaseAdmin();

  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * 画像を削除
 */
export async function deleteImage(path: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

/**
 * 生成に関連する全ての画像を削除
 */
export async function deleteGenerationImages(generationId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  
  // フォルダ内のファイルをリストして削除
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(`generations/${generationId}`);

  if (listError) {
    console.error('Failed to list files:', listError);
    return;
  }

  if (files && files.length > 0) {
    const paths = files.map(f => `generations/${generationId}/${f.name}`);
    
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(paths);

    if (deleteError) {
      console.error('Failed to delete files:', deleteError);
    }
  }
}

/**
 * Supabase Storageの設定が有効かチェック
 */
export function isStorageConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
