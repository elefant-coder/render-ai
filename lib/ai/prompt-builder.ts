import {
  GenerationRequest,
  STYLE_PRESETS,
  MATERIAL_NAMES,
  ROOF_NAMES,
  CAMERA_NAMES,
} from '@/types/generation';

/**
 * 生成リクエストからAI用プロンプトを構築する
 */
export function buildPrompt(request: GenerationRequest): string {
  const style = STYLE_PRESETS.find(s => s.id === request.style);
  const styleName = style?.name || 'Modern';
  const styleKeywords = style?.keywords.join(', ') || '';

  const buildingTypeMap: Record<string, string> = {
    house: 'residential house',
    apartment: 'apartment building',
    building: 'commercial building',
    shop: 'retail shop building'
  };

  const timeMap: Record<string, string> = {
    morning: 'early morning golden hour light',
    noon: 'bright midday sunlight',
    evening: 'warm sunset lighting',
    night: 'evening with ambient lighting and interior lights on'
  };

  const seasonMap: Record<string, string> = {
    spring: 'spring season with cherry blossoms',
    summer: 'summer with lush green vegetation',
    autumn: 'autumn with colorful foliage',
    winter: 'winter with bare trees'
  };

  const cameraMap: Record<string, string> = {
    front: 'front elevation view, eye-level perspective',
    angle45: 'three-quarter view at 45 degrees, showing two facades',
    aerial: 'aerial view from 30 degrees above',
    birdseye: 'bird\'s eye view from directly above',
    closeup: 'close-up view of the entrance',
    distant: 'distant view showing the building in its environment'
  };

  const prompt = `
Photorealistic architectural exterior rendering of a ${styleName} ${buildingTypeMap[request.buildingType]}.

BUILDING SPECIFICATIONS:
- Number of floors: ${request.floors}
- Total floor area: approximately ${request.totalArea} square meters
- Land area: approximately ${request.landArea} square meters
- Land shape: ${request.landShape}

ARCHITECTURAL STYLE:
- Style: ${styleName}
- Design characteristics: ${styleKeywords}

MATERIALS AND FINISHES:
- Exterior wall: ${MATERIAL_NAMES[request.materials.wall]}
- Roof type: ${ROOF_NAMES[request.materials.roof]}
- Primary color: ${request.colors.primary}
- Secondary color: ${request.colors.secondary}
- Accent color: ${request.colors.accent}

ENVIRONMENT AND LIGHTING:
- Time of day: ${timeMap[request.environment.timeOfDay]}
- Season: ${seasonMap[request.environment.season]}
- Weather: clear sky with soft natural shadows

CAMERA AND COMPOSITION:
- View angle: ${cameraMap[request.camera.angle]}
- Lens: professional architectural photography, 24mm wide-angle equivalent
- Focus: sharp throughout, architectural photography style

QUALITY REQUIREMENTS:
- Photorealistic quality
- High detail on materials and textures
- Professional architectural visualization
- Natural landscaping with appropriate vegetation
- Realistic shadows and reflections
- Clean, modern presentation
`.trim();

  return prompt;
}

/**
 * ネガティブプロンプトを生成（不要な要素を除外）
 */
export function buildNegativePrompt(): string {
  return `
blurry, low quality, distorted, cartoon, anime, illustration, 
sketch, painting, unrealistic, fantasy, floating objects,
people, cars, animals, text overlay, watermark, signature,
unfinished construction, scaffolding, construction equipment,
disproportionate, impossible architecture, physically impossible
`.trim();
}

/**
 * 日本語の概要説明を生成
 */
export function buildSummary(request: GenerationRequest): string {
  const style = STYLE_PRESETS.find(s => s.id === request.style);
  
  return `${style?.nameJa || 'モダン'}スタイルの${request.floors}階建て${
    request.buildingType === 'house' ? '住宅' : 
    request.buildingType === 'apartment' ? 'マンション' :
    request.buildingType === 'building' ? 'ビル' : '店舗'
  }（延床${request.totalArea}㎡）`;
}
