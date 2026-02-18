import { GenerationRequest, GeneratedImage, AIModel } from '@/types/generation';
import { generateWithFlux } from './flux';

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
    // 現在はFLUX 2をデフォルトで使用
    // 将来的にはImagen 4やGeminiを追加
    return generateWithFlux(request);
  }

  switch (selectedModel) {
    case 'flux2':
      return generateWithFlux(request);
    
    case 'imagen4':
      // TODO: Imagen 4 実装後に追加
      throw new Error('Imagen 4 is not yet implemented. Please use FLUX 2.');
    
    case 'gemini':
      // TODO: Gemini 3 Pro Image 実装後に追加
      throw new Error('Gemini 3 Pro Image is not yet implemented. Please use FLUX 2.');
    
    default:
      return generateWithFlux(request);
  }
}

/**
 * 利用可能なモデル一覧を取得
 */
export function getAvailableModels(): { id: AIModel; name: string; available: boolean }[] {
  return [
    { id: 'auto', name: '自動選択', available: true },
    { id: 'flux2', name: 'FLUX 2 Pro', available: !!process.env.FAL_KEY },
    { id: 'imagen4', name: 'Imagen 4', available: false },
    { id: 'gemini', name: 'Gemini 3 Pro', available: false },
  ];
}

export { buildPrompt, buildNegativePrompt, buildSummary } from './prompt-builder';
