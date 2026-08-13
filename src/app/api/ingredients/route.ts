import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api-auth";
import { listIngredientsForAdmin } from "@/lib/ingredients";

const ingredientInputSchema = z.object({
  name: z.string().trim().min(1, "食材名を入力してください"),
  expiryDays: z.coerce.number().int().min(0, "賞味期限日数は0以上の整数で入力してください"),
  aliases: z.array(z.string().trim().min(1)).default([]),
});

/**
 * 管理画面用の全件一覧（無効化済みも含む）。`q` を渡すと名前・別名で絞り込む。
 * 在庫登録画面のインクリメンタル検索は GET /api/ingredients/search を使う。
 */
export async function GET(request: Request) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;

  return NextResponse.json(await listIngredientsForAdmin(q));
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  const body = await request.json().catch(() => null);
  const parsed = ingredientInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, expiryDays, aliases } = parsed.data;

  const ingredient = await prisma.ingredient.create({
    data: {
      name,
      expiryDays,
      aliases: { create: aliases.map((aliasName) => ({ aliasName })) },
    },
    include: { aliases: true },
  });

  return NextResponse.json(ingredient, { status: 201 });
}
