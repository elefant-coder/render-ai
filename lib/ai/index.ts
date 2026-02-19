import { GenerationRequest, GeneratedImage, AIModel } from '@/types/generation';
import { generateWithFlux } from './flux';
import { generateWithImagen, isImagen4Available } from './imagen';

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
    // Imagen 4 が利用可能ならそちらを優先（高品質）
    if (isImagen4Available()) {
      return generateWithImagen(request);
    }
    // フォールバックとして FLUX 2
    return generateWithFlux(request);
  }

  switch (selectedModel) {
    case 'imagen4':
      if (!isImagen4Available()) {
        throw new Error('Imagen 4 is not configured. Please set GOOGLE_CLOUD_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS.');
      }
      return generateWithImagen(request);
    
    case 'flux2':
      return generateWithFlux(request);
    
    case 'gemini':
      // TODO: Gemini 3 Pro Image 実装後に追加
      throw new Error('Gemini 3 Pro Image is not yet implemented. Please use FLUX 2 or Imagen 4.');
    
    default:
      return generateWithFlux(request);
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
      available: false,
      description: '近日実装予定'
    },
  ];
}

export { buildPrompt, buildNegativePrompt, buildSummary } from './prompt-builder';
export { generateWithFlux } from './flux';
export { generateWithImagen, isImagen4Available } from './imagen';
