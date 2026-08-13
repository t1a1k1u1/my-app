import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api-auth";

const ingredientInputSchema = z.object({
  name: z.string().trim().min(1, "食材名を入力してください"),
  expiryDays: z.coerce.number().int().min(0, "賞味期限日数は0以上の整数で入力してください"),
  aliases: z.array(z.string().trim().min(1)).default([]),
});

export async function GET(_request: Request, ctx: RouteContext<"/api/ingredients/[id]">) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  const { id } = await ctx.params;
  const ingredient = await prisma.ingredient.findUnique({
    where: { id },
    include: { aliases: true },
  });
  if (!ingredient) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(ingredient);
}

export async function PUT(request: Request, ctx: RouteContext<"/api/ingredients/[id]">) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = ingredientInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, expiryDays, aliases } = parsed.data;

  const exists = await prisma.ingredient.findUnique({ where: { id } });
  if (!exists) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // 別名リストは一旦全削除してから作り直す（件数が少ないため差分更新はしない）
  const ingredient = await prisma.$transaction(async (tx) => {
    await tx.ingredientAlias.deleteMany({ where: { ingredientId: id } });
    return tx.ingredient.update({
      where: { id },
      data: {
        name,
        expiryDays,
        aliases: { create: aliases.map((aliasName) => ({ aliasName })) },
      },
      include: { aliases: true },
    });
  });

  return NextResponse.json(ingredient);
}

/**
 * 在庫が1件でも参照していれば is_active=false（無効化）、参照が無ければ物理削除。spec §3.1.4, §13
 */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/ingredients/[id]">) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  const { id } = await ctx.params;
  const exists = await prisma.ingredient.findUnique({ where: { id } });
  if (!exists) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const referencingStockCount = await prisma.stockItem.count({ where: { ingredientId: id } });

  if (referencingStockCount > 0) {
    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ mode: "deactivated", ingredient });
  }

  await prisma.ingredient.delete({ where: { id } });
  return NextResponse.json({ mode: "deleted" });
}
