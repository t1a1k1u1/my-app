import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api-auth";
import { InvalidIconError, saveIcon } from "@/lib/storage";

export async function POST(request: Request, ctx: RouteContext<"/api/ingredients/[id]/icon">) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  const { id } = await ctx.params;
  const exists = await prisma.ingredient.findUnique({ where: { id } });
  if (!exists) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  let iconImageUrl: string;
  try {
    iconImageUrl = await saveIcon(file);
  } catch (error) {
    if (error instanceof InvalidIconError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  await prisma.ingredient.update({ where: { id }, data: { iconImageUrl } });

  return NextResponse.json({ iconImageUrl });
}
