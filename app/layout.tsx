import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "RenderAI - 外観パース自動生成",
  description: "AIを活用して建築外観パースを自動生成。土地の形状、建物の大きさ、スタイルを入力するだけで、フォトリアルなパースを数秒で作成します。",
  keywords: ["外観パース", "AI", "建築", "パース生成", "Imagen", "FLUX"],
  authors: [{ name: "Elefant" }],
  openGraph: {
    title: "RenderAI - 外観パース自動生成",
    description: "AIを活用して建築外観パースを自動生成",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
