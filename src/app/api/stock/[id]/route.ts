import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api-auth";

/** DELETE /api/stock/:id: 在庫の論理削除（物理削除は行わない）。spec §3.1.1, §6 */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/stock/[id]">) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  const { id } = await ctx.params;

  const { count } = await prisma.stockItem.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  if (count === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ mode: "deleted" });
}
