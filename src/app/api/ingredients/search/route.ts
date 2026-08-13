import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { getFrequentIngredients, getRecentIngredients, searchActiveIngredients } from "@/lib/ingredients";

/**
 * 在庫登録画面のインクリメンタル検索。spec §3.1.2
 * - ?mode=frequent | ?mode=recent -> 検索欄が空のときのデフォルト候補
 * - ?q=文字列                     -> 名前・別名の部分一致（有効な食材のみ）
 */
export async function GET(request: Request) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");

  if (mode === "frequent") {
    return NextResponse.json(await getFrequentIngredients());
  }
  if (mode === "recent") {
    return NextResponse.json(await getRecentIngredients());
  }
  if (mode) {
    return NextResponse.json({ error: "invalid mode" }, { status: 400 });
  }

  const q = searchParams.get("q") ?? "";
  return NextResponse.json(await searchActiveIngredients(q));
}
