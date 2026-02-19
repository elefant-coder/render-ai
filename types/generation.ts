// 建物タイプ
export type BuildingType = 'house' | 'apartment' | 'building' | 'shop';

// 敷地形状
export type LandShape = 'rectangle' | 'square' | 'L-shape' | 'flag' | 'irregular';

// 建築スタイル
export type ArchitecturalStyle = 
  | 'modern_minimal' 
  | 'japanese_modern' 
  | 'scandinavian' 
  | 'industrial' 
  | 'luxury'
  | 'mediterranean'
  | 'american';

// 外壁材
export type WallMaterial = 
  | 'siding' 
  | 'concrete' 
  | 'tile' 
  | 'wood' 
  | 'metal'
  | 'stucco';

// 屋根形状
export type RoofType = 
  | 'flat' 
  | 'gable' 
  | 'hip' 
  | 'shed' 
  | 'gambrel';

// カメラアングル
export type CameraAngle = 
  | 'front' 
  | 'angle45' 
  | 'aerial' 
  | 'birdseye' 
  | 'closeup' 
  | 'distant';

// 時間帯
export type TimeOfDay = 'morning' | 'noon' | 'evening' | 'night';

// 季節
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

// 解像度
export type Resolution = 'sd' | 'hd' | '4k';

// AIモデル
export type AIModel = 'auto' | 'imagen4' | 'flux2' | 'gemini' | 'nano-banana';

// 生成ステータス
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

// 生成リクエスト
export interface GenerationRequest {
  buildingType: BuildingType;
  floors: number;
  totalArea: number;
  landArea: number;
  landShape: LandShape;
  style: ArchitecturalStyle;
  materials: {
    wall: WallMaterial;
    roof: RoofType;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  environment: {
    timeOfDay: TimeOfDay;
    season: Season;
  };
  camera: {
    angle: CameraAngle;
  };
  options: {
    count: 1 | 4;
    resolution: Resolution;
    model: AIModel;
  };
}

// 生成画像
export interface GeneratedImage {
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
}

// 生成結果
export interface GenerationResult {
  id: string;
  userId: string;
  status: GenerationStatus;
  prompt: string;
  parameters: GenerationRequest;
  images: GeneratedImage[];
  modelUsed: AIModel;
  generationTimeMs: number;
  errorMessage?: string;
  isFavorite: boolean;
  createdAt: string;
}

// スタイルプリセット
export interface StylePreset {
  id: ArchitecturalStyle;
  name: string;
  nameJa: string;
  description: string;
  keywords: string[];
  materials: WallMaterial[];
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

// スタイルプリセット一覧
export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'modern_minimal',
    name: 'Modern Minimal',
    nameJa: 'モダンミニマル',
    description: '直線的なデザイン、白を基調とした清潔感のある外観',
    keywords: ['直線的', 'ガラス', 'シンプル', '白基調'],
    materials: ['concrete', 'metal'],
    colors: { primary: '#FFFFFF', secondary: '#2C2C2C', accent: '#4A90D9' }
  },
  {
    id: 'japanese_modern',
    name: 'Japanese Modern',
    nameJa: '和モダン',
    description: '木の温もりと現代的なデザインの融合',
    keywords: ['木材', '格子', '土間', '自然素材'],
    materials: ['wood', 'stucco'],
    colors: { primary: '#8B7355', secondary: '#2C2C2C', accent: '#C4A35A' }
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    nameJa: '北欧スタイル',
    description: '温かみのある自然素材と三角屋根が特徴',
    keywords: ['三角屋根', '温かみ', '自然素材', 'シンプル'],
    materials: ['wood', 'siding'],
    colors: { primary: '#F5F5F0', secondary: '#5C4033', accent: '#E07B39' }
  },
  {
    id: 'industrial',
    name: 'Industrial',
    nameJa: 'インダストリアル',
    description: '鉄骨やコンクリート打放しを活かしたデザイン',
    keywords: ['鉄骨', 'コンクリート', '無骨', 'ロフト'],
    materials: ['concrete', 'metal'],
    colors: { primary: '#4A4A4A', secondary: '#2C2C2C', accent: '#B87333' }
  },
  {
    id: 'luxury',
    name: 'Luxury',
    nameJa: 'ラグジュアリー',
    description: '高級感のある重厚なデザイン',
    keywords: ['高級', '重厚', 'シンメトリー', '石材'],
    materials: ['tile', 'concrete'],
    colors: { primary: '#F8F5F0', secondary: '#1A1A2E', accent: '#D4AF37' }
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    nameJa: '南欧スタイル',
    description: 'テラコッタの屋根と白壁が特徴的',
    keywords: ['テラコッタ', '白壁', 'アーチ', '地中海'],
    materials: ['stucco', 'tile'],
    colors: { primary: '#FFF8DC', secondary: '#8B4513', accent: '#4169E1' }
  },
  {
    id: 'american',
    name: 'American',
    nameJa: 'アメリカン',
    description: 'ラップサイディングとポーチが特徴的',
    keywords: ['ラップサイディング', 'ポーチ', 'ガレージ', '郊外'],
    materials: ['siding', 'wood'],
    colors: { primary: '#FFFFFF', secondary: '#4A5568', accent: '#2D5A27' }
  }
];

// 素材名マッピング
export const MATERIAL_NAMES: Record<WallMaterial, string> = {
  siding: 'サイディング',
  concrete: 'コンクリート',
  tile: 'タイル',
  wood: '木材',
  metal: '金属パネル',
  stucco: '塗り壁'
};

// 屋根形状名マッピング
export const ROOF_NAMES: Record<RoofType, string> = {
  flat: '陸屋根',
  gable: '切妻屋根',
  hip: '寄棟屋根',
  shed: '片流れ屋根',
  gambrel: '入母屋屋根'
};

// カメラアングル名マッピング
export const CAMERA_NAMES: Record<CameraAngle, string> = {
  front: '正面',
  angle45: '斜め45度',
  aerial: '俯瞰',
  birdseye: '鳥瞰',
  closeup: '接近',
  distant: '遠景'
};
