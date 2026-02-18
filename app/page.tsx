'use client';

import { useState } from 'react';
import { Building2 } from 'lucide-react';
import GenerateForm from '@/components/forms/GenerateForm';
import ImagePreview from '@/components/features/ImagePreview';
import { GenerationResult } from '@/types/generation';

export default function Home() {
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [history, setHistory] = useState<GenerationResult[]>([]);

  const handleGenerated = (newResult: GenerationResult) => {
    setResult(newResult);
    setHistory(prev => [newResult, ...prev].slice(0, 10)); // 最新10件を保持
  };

  const handleFavorite = (id: string) => {
    setResult(prev => {
      if (prev && prev.id === id) {
        return { ...prev, isFavorite: !prev.isFavorite };
      }
      return prev;
    });
    setHistory(prev =>
      prev.map(item =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* ヘッダー */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">RenderAI</span>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              Beta
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              履歴
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              設定
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              ログイン
            </a>
          </nav>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">外観パース自動生成</h1>
          <p className="text-muted-foreground">
            建物の情報を入力するだけで、AIがフォトリアルな外観パースを生成します
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 左側: フォーム */}
          <div className="order-2 lg:order-1">
            <GenerateForm onGenerated={handleGenerated} />
          </div>

          {/* 右側: プレビュー */}
          <div className="order-1 lg:order-2 lg:sticky lg:top-24 h-fit">
            <ImagePreview result={result} onFavorite={handleFavorite} />
          </div>
        </div>

        {/* 履歴セクション */}
        {history.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-bold mb-4">最近の生成履歴</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setResult(item)}
                  className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                    result?.id === item.id ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img
                    src={item.images[0]?.url}
                    alt="History item"
                    className="w-full h-full object-cover"
                  />
                  {item.isFavorite && (
                    <div className="absolute top-1 right-1 text-red-500">
                      ❤️
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* フッター */}
      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 RenderAI - Built with Next.js & AI</p>
          <p className="mt-2">
            Powered by FLUX 2 / Imagen 4 / Gemini
          </p>
        </div>
      </footer>
    </div>
  );
}
