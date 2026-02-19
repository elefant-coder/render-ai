import { GenerationRequest, GeneratedImage, AIModel } from '@/types/generation';
import { buildPrompt, buildNegativePrompt } from './prompt-builder';

/**
 * Google Cloud Vertex AI - Imagen 4 API
 * https://cloud.google.com/vertex-ai/generative-ai/docs/image/generate-images
 */

const VERTEX_AI_ENDPOINT = 'https://us-central1-aiplatform.googleapis.com';
const MODEL_ID = 'imagen-4.0-generate-001'; // Imagen 4 最新モデル

interface ImagenRequest {
  instances: Array<{
    prompt: string;
    negativePrompt?: string;
  }>;
  parameters: {
    sampleCount: number;
    aspectRatio: string;
    outputOptions?: {
      mimeType: 'image/png' | 'image/jpeg';
    };
    addWatermark?: boolean;
    safetySetting?: 'block_few' | 'block_some' | 'block_most';
    personGeneration?: 'dont_allow' | 'allow_adult';
  };
}

interface ImagenResponse {
  predictions: Array<{
    bytesBase64Encoded: string;
    mimeType: string;
  }>;
}

/**
 * Google Cloud アクセストークンを取得
 */
async function getAccessToken(): Promise<string> {
  // GOOGLE_APPLICATION_CREDENTIALS が設定されている場合、
  // サービスアカウントからトークンを取得
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  if (!credentialsPath) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS is not set');
  }

  // Node.js 環境では google-auth-library を使用
  // Next.js サーバーサイドで動作
  try {
    const { GoogleAuth } = await import('google-auth-library');
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    
    if (!tokenResponse.token) {
      throw new Error('Failed to obtain access token');
    }
    
    return tokenResponse.token;
  } catch (error) {
    console.error('Failed to get access token:', error);
    throw new Error('Google Cloud authentication failed');
  }
}

/**
 * 解像度からアスペクト比を取得
 */
function getAspectRatio(resolution: string): string {
  // Imagen 4 がサポートするアスペクト比
  // 1:1, 9:16, 16:9, 3:4, 4:3
  // 建築パースは横長が一般的
  return '16:9';
}

/**
 * 解像度から画像サイズを取得
 */
function getImageSize(resolution: string): { width: number; height: number } {
  switch (resolution) {
    case '4k':
      return { width: 3840, height: 2160 };
    case 'hd':
      return { width: 1920, height: 1080 };
    case 'sd':
    default:
      return { width: 1280, height: 720 };
  }
}

/**
 * Imagen 4 で画像を生成
 */
export async function generateWithImagen(
  request: GenerationRequest
): Promise<{
  images: GeneratedImage[];
  prompt: string;
  model: AIModel;
  timeMs: number;
}> {
  const startTime = Date.now();
  
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  if (!projectId) {
    throw new Error('GOOGLE_CLOUD_PROJECT_ID is not set');
  }

  // プロンプト構築
  const prompt = buildPrompt(request);
  const negativePrompt = buildNegativePrompt();
  
  const accessToken = await getAccessToken();
  
  // Imagen 4 API リクエスト
  const imagenRequest: ImagenRequest = {
    instances: [
      {
        prompt,
        negativePrompt,
      },
    ],
    parameters: {
      sampleCount: request.options.count,
      aspectRatio: getAspectRatio(request.options.resolution),
      outputOptions: {
        mimeType: 'image/png',
      },
      addWatermark: false,
      safetySetting: 'block_some',
      personGeneration: 'dont_allow', // 建築パースには人物は不要
    },
  };

  const endpoint = `${VERTEX_AI_ENDPOINT}/v1/projects/${projectId}/locations/us-central1/publishers/google/models/${MODEL_ID}:predict`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(imagenRequest),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Imagen 4 API error:', errorText);
    throw new Error(`Imagen 4 API error: ${response.status} ${response.statusText}`);
  }

  const data: ImagenResponse = await response.json();
  
  const imageSize = getImageSize(request.options.resolution);
  
  // Base64画像をGeneratedImage形式に変換
  const images: GeneratedImage[] = data.predictions.map((prediction, index) => {
    // 実際のデプロイ時は R2 にアップロードして URL を返す
    // ここでは data URL として返す（開発用）
    const dataUrl = `data:${prediction.mimeType};base64,${prediction.bytesBase64Encoded}`;
    
    return {
      url: dataUrl,
      thumbnailUrl: dataUrl, // 本番では別途サムネイルを生成
      width: imageSize.width,
      height: imageSize.height,
    };
  });

  const timeMs = Date.now() - startTime;

  return {
    images,
    prompt,
    model: 'imagen4',
    timeMs,
  };
}

/**
 * Imagen 4 の利用可否をチェック
 */
export function isImagen4Available(): boolean {
  return !!(
    process.env.GOOGLE_CLOUD_PROJECT_ID &&
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
}
