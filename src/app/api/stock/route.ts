import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api-auth";
import { listStockForUser } from "@/lib/stock";

const stockInputSchema = z.object({
  ingredientId: z.string().min(1),
  // 未指定なら当日。YYYY-MM-DD（spec §3.1.1: 登録日はデフォルト当日、変更可）
  registeredAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD形式で入力してください")
    .optional(),
});

function todayDateOnly(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** GET /api/stock: 在庫一覧（deleted_at IS NULL、賞味期限が近い順）。spec §6 */
export async function GET() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  return NextResponse.json(await listStockForUser(userId));
}

/** POST /api/stock: 在庫登録（ingredient_id, registered_at）。数量フィールドは持たない。spec §3.1.1, §6 */
export async function POST(request: Request) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  const body = await request.json().catch(() => null);
  const parsed = stockInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { ingredientId, registeredAt } = parsed.data;

  const ingredient = await prisma.ingredient.findUnique({ where: { id: ingredientId } });
  if (!ingredient || !ingredient.isActive) {
    return NextResponse.json({ error: "invalid ingredientId" }, { status: 400 });
  }

  const stockItem = await prisma.stockItem.create({
    data: {
      userId,
      ingredientId,
      registeredAt: registeredAt ? new Date(`${registeredAt}T00:00:00.000Z`) : todayDateOnly(),
    },
    include: { ingredient: true },
  });

  return NextResponse.json(stockItem, { status: 201 });
}
