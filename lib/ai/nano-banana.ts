import { GenerationRequest, GeneratedImage, AIModel } from '@/types/generation';
import { buildPrompt, buildNegativePrompt } from './prompt-builder';

/**
 * Nano Banana Pro - Google's Gemini 3 Pro Image Generation Model
 * Hosted on fal.ai
 * https://fal.ai/models/fal-ai/nano-banana-pro
 */

const FAL_API_URL = 'https://fal.run/fal-ai/nano-banana-pro';

interface NanoBananaInput {
  prompt: string;
  resolution?: '1K' | '2K' | '4K';
  num_images?: number;
  aspect_ratio?: '21:9' | '16:9' | '3:2' | '4:3' | '5:4' | '1:1' | '4:5' | '3:4' | '2:3' | '9:16' | 'auto';
  output_format?: 'jpeg' | 'png' | 'webp';
  safety_tolerance?: '1' | '2' | '3' | '4' | '5' | '6';
  seed?: number;
}

interface NanoBananaOutput {
  images: {
    url: string;
    width?: number;
    height?: number;
    content_type?: string;
    file_name?: string;
  }[];
  description?: string;
}

/**
 * 解像度マッピング
 */
function getResolution(resolution: string): '1K' | '2K' | '4K' {
  switch (resolution) {
    case '4k':
      return '4K';
    case 'hd':
      return '2K';
    case 'sd':
    default:
      return '1K';
  }
}

/**
 * アスペクト比を取得（建築パースは横長が一般的）
 */
function getAspectRatio(): '16:9' {
  return '16:9';
}

/**
 * 解像度から画像サイズを推定
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
 * Nano Banana Pro で画像を生成
 */
export async function generateWithNanoBanana(
  request: GenerationRequest
): Promise<{
  images: GeneratedImage[];
  prompt: string;
  model: AIModel;
  timeMs: number;
}> {
  const apiKey = process.env.FAL_KEY;

  if (!apiKey) {
    throw new Error('FAL_KEY is not configured');
  }

  const prompt = buildPrompt(request);
  const startTime = Date.now();

  const input: NanoBananaInput = {
    prompt,
    resolution: getResolution(request.options.resolution),
    num_images: request.options.count,
    aspect_ratio: getAspectRatio(),
    output_format: 'jpeg',
    safety_tolerance: '4',
  };

  const response = await fetch(FAL_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Nano Banana Pro API error: ${response.status} - ${error}`);
  }

  const data: NanoBananaOutput = await response.json();
  const timeMs = Date.now() - startTime;

  const imageSize = getImageSize(request.options.resolution);

  const images: GeneratedImage[] = data.images.map((img) => ({
    url: img.url,
    thumbnailUrl: img.url,
    width: img.width || imageSize.width,
    height: img.height || imageSize.height,
  }));

  return {
    images,
    prompt,
    model: 'nano-banana',
    timeMs,
  };
}

/**
 * Nano Banana Pro の利用可否をチェック
 */
export function isNanoBananaAvailable(): boolean {
  return !!process.env.FAL_KEY;
}
