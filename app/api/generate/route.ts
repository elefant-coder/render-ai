import { NextRequest, NextResponse } from 'next/server';
import { generateImages, buildSummary } from '@/lib/ai';
import { GenerationRequest, GenerationResult } from '@/types/generation';
import { z } from 'zod';

// リクエストバリデーションスキーマ
const GenerationSchema = z.object({
  buildingType: z.enum(['house', 'apartment', 'building', 'shop']),
  floors: z.number().min(1).max(10),
  totalArea: z.number().min(50).max(1000),
  landArea: z.number().min(50).max(2000),
  landShape: z.enum(['rectangle', 'square', 'L-shape', 'flag', 'irregular']),
  style: z.enum([
    'modern_minimal', 'japanese_modern', 'scandinavian',
    'industrial', 'luxury', 'mediterranean', 'american'
  ]),
  materials: z.object({
    wall: z.enum(['siding', 'concrete', 'tile', 'wood', 'metal', 'stucco']),
    roof: z.enum(['flat', 'gable', 'hip', 'shed', 'gambrel']),
  }),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
  }),
  environment: z.object({
    timeOfDay: z.enum(['morning', 'noon', 'evening', 'night']),
    season: z.enum(['spring', 'summer', 'autumn', 'winter']),
  }),
  camera: z.object({
    angle: z.enum(['front', 'angle45', 'aerial', 'birdseye', 'closeup', 'distant']),
  }),
  options: z.object({
    count: z.union([z.literal(1), z.literal(4)]),
    resolution: z.enum(['sd', 'hd', '4k']),
    model: z.enum(['auto', 'imagen4', 'flux2', 'gemini', 'nano-banana']),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // バリデーション
    const validationResult = GenerationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters',
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const generationRequest: GenerationRequest = validationResult.data;

    // 生成実行
    const result = await generateImages(generationRequest);

    // 結果を構築
    const generationResult: GenerationResult = {
      id: crypto.randomUUID(),
      userId: 'anonymous', // TODO: 認証実装後に置き換え
      status: 'completed',
      prompt: result.prompt,
      parameters: generationRequest,
      images: result.images,
      modelUsed: result.model,
      generationTimeMs: result.timeMs,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };

    // TODO: データベースに保存

    return NextResponse.json(generationResult);

  } catch (error) {
    console.error('Generation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Generation failed',
        message: errorMessage 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'RenderAI Generation API',
    version: '1.0.0',
    endpoints: {
      'POST /api/generate': 'Generate exterior rendering',
    }
  });
}
