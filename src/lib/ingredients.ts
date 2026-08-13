import { prisma } from "@/lib/prisma";

const DEFAULT_SUGGESTION_LIMIT = 8;
const RECENT_SCAN_WINDOW = 200;

export type IngredientSummary = {
  id: string;
  name: string;
  iconImageUrl: string | null;
  expiryDays: number;
  aliases: string[];
};

type IngredientWithAliases = {
  id: string;
  name: string;
  iconImageUrl: string | null;
  expiryDays: number;
  aliases: { aliasName: string }[];
};

function toSummary(ingredient: IngredientWithAliases): IngredientSummary {
  return {
    id: ingredient.id,
    name: ingredient.name,
    iconImageUrl: ingredient.iconImageUrl,
    expiryDays: ingredient.expiryDays,
    aliases: ingredient.aliases.map((a) => a.aliasName),
  };
}

/** 食材名・別名の部分一致検索（無効化された食材は除外）。spec §3.1.2 */
export async function searchActiveIngredients(query: string): Promise<IngredientSummary[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const rows = await prisma.ingredient.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: trimmed, mode: "insensitive" } },
        { aliases: { some: { aliasName: { contains: trimmed, mode: "insensitive" } } } },
      ],
    },
    include: { aliases: true },
    orderBy: { name: "asc" },
    take: 30,
  });
  return rows.map(toSummary);
}

/**
 * 「よく登録するもの」: 論理削除済みも含めた累計在庫登録件数が多い順。spec §3.1.2, §13
 */
export async function getFrequentIngredients(
  limit = DEFAULT_SUGGESTION_LIMIT
): Promise<IngredientSummary[]> {
  const counts = await prisma.stockItem.groupBy({
    by: ["ingredientId"],
    _count: { _all: true },
    orderBy: { _count: { ingredientId: "desc" } },
  });
  if (counts.length === 0) return [];

  const ingredients = await prisma.ingredient.findMany({
    where: { id: { in: counts.map((c) => c.ingredientId) }, isActive: true },
    include: { aliases: true },
  });
  const byId = new Map(ingredients.map((i) => [i.id, i]));

  const ordered: IngredientSummary[] = [];
  for (const c of counts) {
    const ingredient = byId.get(c.ingredientId);
    if (!ingredient) continue;
    ordered.push(toSummary(ingredient));
    if (ordered.length >= limit) break;
  }
  return ordered;
}

/**
 * 「最近登録したもの」: 直近で登録された食材、重複する食材名は除いて新しい順。spec §3.1.2
 * 実際の登録操作日時（StockItem.createdAt）で新しさを判定する（registeredAtはユーザーが
 * 自由に変更できるため、実際に「最近登録した」実績を表さない）。
 */
export async function getRecentIngredients(
  limit = DEFAULT_SUGGESTION_LIMIT
): Promise<IngredientSummary[]> {
  const recentStock = await prisma.stockItem.findMany({
    orderBy: { createdAt: "desc" },
    take: RECENT_SCAN_WINDOW,
    include: { ingredient: { include: { aliases: true } } },
  });

  const seen = new Set<string>();
  const ordered: IngredientSummary[] = [];
  for (const item of recentStock) {
    if (!item.ingredient.isActive) continue;
    if (seen.has(item.ingredientId)) continue;
    seen.add(item.ingredientId);
    ordered.push(toSummary(item.ingredient));
    if (ordered.length >= limit) break;
  }
  return ordered;
}

/** 管理画面用の全件一覧（無効化済みも含む）。spec §3.1.4, §3.3 */
export async function listIngredientsForAdmin(query?: string) {
  const trimmed = query?.trim();
  const rows = await prisma.ingredient.findMany({
    where: trimmed
      ? {
          OR: [
            { name: { contains: trimmed, mode: "insensitive" } },
            { aliases: { some: { aliasName: { contains: trimmed, mode: "insensitive" } } } },
          ],
        }
      : undefined,
    include: { aliases: true },
    orderBy: { name: "asc" },
  });
  return rows.map((r) => ({ ...toSummary(r), isActive: r.isActive }));
}
