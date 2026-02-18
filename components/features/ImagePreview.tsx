'use client';

import { useState } from 'react';
import { Download, Heart, ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GenerationResult } from '@/types/generation';

interface ImagePreviewProps {
  result: GenerationResult | null;
  onFavorite?: (id: string) => void;
}

export default function ImagePreview({ result, onFavorite }: ImagePreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!result || result.images.length === 0) {
    return (
      <Card className="w-full h-full min-h-[400px] flex items-center justify-center">
        <CardContent className="text-center text-muted-foreground">
          <div className="text-6xl mb-4">🏠</div>
          <p>左側のフォームから設定して</p>
          <p>「パースを生成」ボタンを押してください</p>
        </CardContent>
      </Card>
    );
  }

  const currentImage = result.images[currentIndex];
  const hasMultiple = result.images.length > 1;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? result.images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === result.images.length - 1 ? 0 : prev + 1));
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(currentImage.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `render-ai-${result.id}-${currentIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDownloadAll = async () => {
    for (let i = 0; i < result.images.length; i++) {
      const img = result.images[i];
      try {
        const response = await fetch(img.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `render-ai-${result.id}-${i + 1}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        // 少し待ってから次をダウンロード
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Download failed for image ${i + 1}:`, error);
      }
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardContent className="p-4 space-y-4">
          {/* メイン画像 */}
          <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden group">
            <img
              src={currentImage.url}
              alt={`Generated render ${currentIndex + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* ナビゲーション */}
            {hasMultiple && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* フルスクリーンボタン */}
            <button
              onClick={() => setIsFullscreen(true)}
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Maximize2 className="h-4 w-4" />
            </button>

            {/* ページインジケーター */}
            {hasMultiple && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
                {currentIndex + 1} / {result.images.length}
              </div>
            )}
          </div>

          {/* サムネイル */}
          {hasMultiple && (
            <div className="flex gap-2 justify-center">
              {result.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-16 h-12 rounded-md overflow-hidden border-2 transition-all ${
                    idx === currentIndex ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex gap-2">
            <Button onClick={handleDownload} variant="outline" className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              ダウンロード
            </Button>
            {hasMultiple && (
              <Button onClick={handleDownloadAll} variant="outline" className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                全てダウンロード
              </Button>
            )}
            <Button
              onClick={() => onFavorite?.(result.id)}
              variant={result.isFavorite ? 'default' : 'outline'}
              size="icon"
            >
              <Heart className={`h-4 w-4 ${result.isFavorite ? 'fill-current' : ''}`} />
            </Button>
          </div>

          {/* 生成情報 */}
          <div className="text-sm text-muted-foreground space-y-1 pt-4 border-t">
            <div>
              <span className="font-medium">モデル:</span> {result.modelUsed.toUpperCase()}
            </div>
            <div>
              <span className="font-medium">生成時間:</span> {(result.generationTimeMs / 1000).toFixed(1)}秒
            </div>
            <div>
              <span className="font-medium">解像度:</span> {currentImage.width} × {currentImage.height}
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer font-medium">使用プロンプト</summary>
              <p className="mt-2 text-xs bg-muted p-2 rounded whitespace-pre-wrap">
                {result.prompt}
              </p>
            </details>
          </div>
        </CardContent>
      </Card>

      {/* フルスクリーンモーダル */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
          
          <img
            src={currentImage.url}
            alt="Fullscreen view"
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {hasMultiple && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-lg">
                {currentIndex + 1} / {result.images.length}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
