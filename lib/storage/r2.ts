/**
 * Cloudflare R2 Storage Client
 * AWS S3 互換 API を使用
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// R2 クライアントの初期化
function createR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials not configured');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

// シングルトンインスタンス
let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!r2Client) {
    r2Client = createR2Client();
  }
  return r2Client;
}

// バケット名
function getBucketName(): string {
  const bucketName = process.env.R2_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('R2_BUCKET_NAME not configured');
  }
  return bucketName;
}

// パブリックURL
function getPublicUrl(): string {
  return process.env.R2_PUBLIC_URL || '';
}

/**
 * 画像をR2にアップロード
 * 
 * @param buffer - 画像のバイナリデータ
 * @param key - ストレージ上のキー（パス）
 * @param contentType - MIMEタイプ
 * @returns アップロードされた画像のURL
 */
export async function uploadImage(
  buffer: Buffer,
  key: string,
  contentType: string = 'image/png'
): Promise<string> {
  const client = getR2Client();
  const bucketName = getBucketName();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000', // 1年キャッシュ
  });

  await client.send(command);

  // パブリックURLがある場合はそれを使用、なければ署名付きURLを生成
  const publicUrl = getPublicUrl();
  if (publicUrl) {
    return `${publicUrl}/${key}`;
  }

  // 署名付きURL（7日間有効）
  return getSignedUrl(client, new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  }), { expiresIn: 604800 });
}

/**
 * Base64画像をR2にアップロード
 */
export async function uploadBase64Image(
  base64Data: string,
  key: string
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
  return uploadImage(buffer, key, contentType);
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
    const key = `generations/${generationId}/${i}.png`;
    const thumbnailKey = `generations/${generationId}/${i}_thumb.png`;
    
    // オリジナル画像をアップロード
    const url = await uploadBase64Image(base64Data, key);
    
    // サムネイルは同じ画像を使用（本番では縮小処理を追加）
    // TODO: Sharp等でサムネイル生成
    const thumbnailUrl = await uploadBase64Image(base64Data, thumbnailKey);
    
    results.push({ url, thumbnailUrl });
  }
  
  return results;
}

/**
 * 画像を取得（署名付きURL）
 */
export async function getImageUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const client = getR2Client();
  const bucketName = getBucketName();

  // パブリックURLがある場合はそれを使用
  const publicUrl = getPublicUrl();
  if (publicUrl) {
    return `${publicUrl}/${key}`;
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * 画像を削除
 */
export async function deleteImage(key: string): Promise<void> {
  const client = getR2Client();
  const bucketName = getBucketName();

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await client.send(command);
}

/**
 * 生成に関連する全ての画像を削除
 */
export async function deleteGenerationImages(generationId: string): Promise<void> {
  // 最大4枚 + サムネイル4枚 = 8ファイル
  const keys = [];
  for (let i = 0; i < 4; i++) {
    keys.push(`generations/${generationId}/${i}.png`);
    keys.push(`generations/${generationId}/${i}_thumb.png`);
  }

  await Promise.allSettled(keys.map(key => deleteImage(key)));
}

/**
 * R2の設定が有効かチェック
 */
export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}
