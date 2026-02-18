import { GenerationRequest, GeneratedImage, AIModel } from '@/types/generation';
import { buildPrompt, buildNegativePrompt } from './prompt-builder';

// fal.ai FLUX 2 API エンドポイント
const FAL_API_URL = 'https://fal.run/fal-ai/flux-pro/v1.1';

interface FalResponse {
  images: {
    url: string;
    width: number;
    height: number;
    content_type: string;
  }[];
  prompt: string;
  seed: number;
  has_nsfw_concepts: boolean[];
  timings: {
    inference: number;
  };
}

/**
 * FLUX 2を使用して画像を生成
 */
export async function generateWithFlux(
  request: GenerationRequest
): Promise<{ images: GeneratedImage[]; prompt: string; model: AIModel; timeMs: number }> {
  const apiKey = process.env.FAL_KEY;
  
  if (!apiKey) {
    throw new Error('FAL_KEY is not configured');
  }

  const prompt = buildPrompt(request);
  const negativePrompt = buildNegativePrompt();

  // 解像度マッピング
  const sizeMap = {
    sd: { width: 1024, height: 768 },
    hd: { width: 1536, height: 1024 },
    '4k': { width: 2048, height: 1536 }
  };

  const size = sizeMap[request.options.resolution] || sizeMap.hd;

  const startTime = Date.now();

  const response = await fetch(FAL_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      negative_prompt: negativePrompt,
      image_size: {
        width: size.width,
        height: size.height,
      },
      num_images: request.options.count,
      seed: Math.floor(Math.random() * 1000000),
      guidance_scale: 7.5,
      num_inference_steps: 28,
      safety_tolerance: '2',
      output_format: 'jpeg',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`FLUX API error: ${response.status} - ${error}`);
  }

  const data: FalResponse = await response.json();
  const timeMs = Date.now() - startTime;

  const images: GeneratedImage[] = data.images.map(img => ({
    url: img.url,
    thumbnailUrl: img.url, // fal.aiはサムネイルを自動生成しない
    width: img.width,
    height: img.height,
  }));

  return {
    images,
    prompt,
    model: 'flux2',
    timeMs,
  };
}

/**
 * fal.ai APIの接続テスト
 */
export async function testFluxConnection(): Promise<boolean> {
  const apiKey = process.env.FAL_KEY;
  
  if (!apiKey) {
    return false;
  }

  try {
    const response = await fetch('https://fal.run/fal-ai/flux-pro/v1.1', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'test',
        image_size: { width: 256, height: 256 },
        num_images: 1,
      }),
    });
    
    return response.ok;
  } catch {
    return false;
  }
}
