import { GenerationRequest, GeneratedImage, AIModel } from '@/types/generation';
import { generateWithFlux } from './flux';
import { generateWithImagen, isImagen4Available } from './imagen';
import { generateWithNanoBanana, isNanoBananaAvailable } from './nano-banana';

interface GenerationOutput {
  images: GeneratedImage[];
  prompt: string;
  model: AIModel;
  timeMs: number;
}

/**
 * AI画像生成のメインエントリーポイント
 * リクエストに応じて適切なモデルを選択して生成
 */
export async function generateImages(
  request: GenerationRequest
): Promise<GenerationOutput> {
  const selectedModel = request.options.model;

  // 自動選択の場合、利用可能なモデルから選択
  if (selectedModel === 'auto') {
    // Nano Banana Pro が利用可能ならそちらを優先（最高品質）
    if (isNanoBananaAvailable()) {
      return generateWithNanoBanana(request);
    }
    // Imagen 4 が利用可能なら次に優先
    if (isImagen4Available()) {
      return generateWithImagen(request);
    }
    // フォールバックとして FLUX 2
    return generateWithFlux(request);
  }

  switch (selectedModel) {
    case 'nano-banana':
      if (!isNanoBananaAvailable()) {
        throw new Error('Nano Banana Pro is not configured. Please set FAL_KEY.');
      }
      return generateWithNanoBanana(request);

    case 'imagen4':
      if (!isImagen4Available()) {
        throw new Error('Imagen 4 is not configured. Please set GOOGLE_CLOUD_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS.');
      }
      return generateWithImagen(request);
    
    case 'flux2':
      return generateWithFlux(request);
    
    case 'gemini':
      // Gemini は Nano Banana Pro で代替
      return generateWithNanoBanana(request);
    
    default:
      return generateWithNanoBanana(request);
  }
}

/**
 * 利用可能なモデル一覧を取得
 */
export function getAvailableModels(): { id: AIModel; name: string; available: boolean; description: string }[] {
  return [
    { 
      id: 'auto', 
      name: '自動選択', 
      available: true,
      description: '最適なモデルを自動選択'
    },
    { 
      id: 'nano-banana', 
      name: 'Nano Banana Pro', 
      available: isNanoBananaAvailable(),
      description: 'Gemini 3 Pro Image - 最高品質の建築パース生成'
    },
    { 
      id: 'imagen4', 
      name: 'Imagen 4', 
      available: isImagen4Available(),
      description: 'Google製、高品質な建築パース向け'
    },
    { 
      id: 'flux2', 
      name: 'FLUX 2 Pro', 
      available: !!process.env.FAL_KEY,
      description: '高速生成、コスト効率が良い'
    },
    { 
      id: 'gemini', 
      name: 'Gemini 3 Pro', 
      available: isNanoBananaAvailable(),
      description: 'Nano Banana Pro として利用可能'
    },
  ];
}

export { buildPrompt, buildNegativePrompt, buildSummary } from './prompt-builder';
export { generateWithFlux } from './flux';
export { generateWithImagen, isImagen4Available } from './imagen';
export { generateWithNanoBanana, isNanoBananaAvailable } from './nano-banana';
