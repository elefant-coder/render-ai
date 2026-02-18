'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Wand2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

import {
  GenerationRequest,
  GenerationResult,
  STYLE_PRESETS,
  MATERIAL_NAMES,
  ROOF_NAMES,
  CAMERA_NAMES,
  WallMaterial,
  RoofType,
  CameraAngle,
} from '@/types/generation';

const formSchema = z.object({
  buildingType: z.enum(['house', 'apartment', 'building', 'shop']),
  floors: z.number().min(1).max(10),
  totalArea: z.number().min(50).max(1000),
  landArea: z.number().min(50).max(2000),
  landShape: z.enum(['rectangle', 'square', 'L-shape', 'flag', 'irregular']),
  style: z.string(),
  wallMaterial: z.string(),
  roofType: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  timeOfDay: z.enum(['morning', 'noon', 'evening', 'night']),
  season: z.enum(['spring', 'summer', 'autumn', 'winter']),
  cameraAngle: z.string(),
  count: z.number(),
  resolution: z.enum(['sd', 'hd', '4k']),
});

type FormData = z.infer<typeof formSchema>;

interface GenerateFormProps {
  onGenerated: (result: GenerationResult) => void;
}

export default function GenerateForm({ onGenerated }: GenerateFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      buildingType: 'house',
      floors: 2,
      totalArea: 120,
      landArea: 150,
      landShape: 'rectangle',
      style: 'modern_minimal',
      wallMaterial: 'concrete',
      roofType: 'flat',
      primaryColor: '#FFFFFF',
      secondaryColor: '#2C2C2C',
      accentColor: '#4A90D9',
      timeOfDay: 'noon',
      season: 'summer',
      cameraAngle: 'angle45',
      count: 4,
      resolution: 'hd',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);

    const request: GenerationRequest = {
      buildingType: data.buildingType,
      floors: data.floors,
      totalArea: data.totalArea,
      landArea: data.landArea,
      landShape: data.landShape,
      style: data.style as GenerationRequest['style'],
      materials: {
        wall: data.wallMaterial as WallMaterial,
        roof: data.roofType as RoofType,
      },
      colors: {
        primary: data.primaryColor,
        secondary: data.secondaryColor,
        accent: data.accentColor,
      },
      environment: {
        timeOfDay: data.timeOfDay,
        season: data.season,
      },
      camera: {
        angle: data.cameraAngle as CameraAngle,
      },
      options: {
        count: data.count as 1 | 4,
        resolution: data.resolution,
        model: 'auto',
      },
    };

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Generation failed');
      }

      const result: GenerationResult = await response.json();
      onGenerated(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // スタイル選択時にカラーをプリセットに合わせる
  const handleStyleChange = (styleId: string) => {
    const preset = STYLE_PRESETS.find(s => s.id === styleId);
    if (preset) {
      form.setValue('style', styleId);
      form.setValue('primaryColor', preset.colors.primary);
      form.setValue('secondaryColor', preset.colors.secondary);
      form.setValue('accentColor', preset.colors.accent);
      if (preset.materials.length > 0) {
        form.setValue('wallMaterial', preset.materials[0]);
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          パース生成設定
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* 建物基本情報 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">建物情報</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>建物タイプ</Label>
                <Select
                  value={form.watch('buildingType')}
                  onValueChange={(v) => form.setValue('buildingType', v as FormData['buildingType'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="house">戸建て住宅</SelectItem>
                    <SelectItem value="apartment">マンション</SelectItem>
                    <SelectItem value="building">ビル</SelectItem>
                    <SelectItem value="shop">店舗</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>階数</Label>
                <Select
                  value={String(form.watch('floors'))}
                  onValueChange={(v) => form.setValue('floors', parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(n => (
                      <SelectItem key={n} value={String(n)}>{n}階</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>延床面積 ({form.watch('totalArea')} ㎡)</Label>
                <Slider
                  value={[form.watch('totalArea')]}
                  onValueChange={([v]) => form.setValue('totalArea', v)}
                  min={50}
                  max={500}
                  step={10}
                />
              </div>

              <div className="space-y-2">
                <Label>敷地面積 ({form.watch('landArea')} ㎡)</Label>
                <Slider
                  value={[form.watch('landArea')]}
                  onValueChange={([v]) => form.setValue('landArea', v)}
                  min={50}
                  max={500}
                  step={10}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>敷地形状</Label>
              <Select
                value={form.watch('landShape')}
                onValueChange={(v) => form.setValue('landShape', v as FormData['landShape'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rectangle">長方形</SelectItem>
                  <SelectItem value="square">正方形</SelectItem>
                  <SelectItem value="L-shape">L字型</SelectItem>
                  <SelectItem value="flag">旗竿地</SelectItem>
                  <SelectItem value="irregular">不整形</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* デザインスタイル */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">デザインスタイル</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleStyleChange(preset.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    form.watch('style') === preset.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium text-sm">{preset.nameJa}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {preset.keywords.slice(0, 2).join('・')}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 素材 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">素材・仕上げ</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>外壁材</Label>
                <Select
                  value={form.watch('wallMaterial')}
                  onValueChange={(v) => form.setValue('wallMaterial', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MATERIAL_NAMES).map(([key, name]) => (
                      <SelectItem key={key} value={key}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>屋根形状</Label>
                <Select
                  value={form.watch('roofType')}
                  onValueChange={(v) => form.setValue('roofType', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROOF_NAMES).map(([key, name]) => (
                      <SelectItem key={key} value={key}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* カラー */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>メインカラー</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    {...form.register('primaryColor')}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    {...form.register('primaryColor')}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>サブカラー</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    {...form.register('secondaryColor')}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    {...form.register('secondaryColor')}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>アクセント</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    {...form.register('accentColor')}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    {...form.register('accentColor')}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 環境設定 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">環境・撮影設定</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>時間帯</Label>
                <Select
                  value={form.watch('timeOfDay')}
                  onValueChange={(v) => form.setValue('timeOfDay', v as FormData['timeOfDay'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">朝</SelectItem>
                    <SelectItem value="noon">昼</SelectItem>
                    <SelectItem value="evening">夕方</SelectItem>
                    <SelectItem value="night">夜</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>季節</Label>
                <Select
                  value={form.watch('season')}
                  onValueChange={(v) => form.setValue('season', v as FormData['season'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spring">春</SelectItem>
                    <SelectItem value="summer">夏</SelectItem>
                    <SelectItem value="autumn">秋</SelectItem>
                    <SelectItem value="winter">冬</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>アングル</Label>
                <Select
                  value={form.watch('cameraAngle')}
                  onValueChange={(v) => form.setValue('cameraAngle', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CAMERA_NAMES).map(([key, name]) => (
                      <SelectItem key={key} value={key}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 生成オプション */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">生成オプション</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>生成枚数</Label>
                <Select
                  value={String(form.watch('count'))}
                  onValueChange={(v) => form.setValue('count', parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1枚</SelectItem>
                    <SelectItem value="4">4枚</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>解像度</Label>
                <Select
                  value={form.watch('resolution')}
                  onValueChange={(v) => form.setValue('resolution', v as FormData['resolution'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sd">SD (1024×768)</SelectItem>
                    <SelectItem value="hd">HD (1536×1024)</SelectItem>
                    <SelectItem value="4k">4K (2048×1536)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 生成ボタン */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                パースを生成
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
