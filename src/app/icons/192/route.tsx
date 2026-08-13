import { ImageResponse } from "next/og";
import { AppIconGlyph } from "@/lib/app-icon";

const size = { width: 192, height: 192 };

// manifest.ts の icons 用（favicon/apple-icon とはサイズ要件が異なるため別ルートで生成）
export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(<AppIconGlyph size={size.width} />, size);
}
