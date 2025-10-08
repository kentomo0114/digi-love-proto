import type { Metadata } from "next";
import "../styles/theme.css";
import "./globals.css";
import { Pixelify_Sans, Noto_Sans_JP } from "next/font/google";

const pixel = Pixelify_Sans({ subsets: ["latin"], variable: "--font-pixel" });
const noto = Noto_Sans_JP({ subsets: ["latin"], variable: "--font-noto" });

export const metadata: Metadata = {
  title: "digi love",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${pixel.variable} ${noto.variable}`}>
      <body>{children}</body>
    </html>
  );
}
