import { prisma } from "@/lib/prisma";

export type ExpiryStatus = "expired" | "soon" | "normal";

export type StockListItem = {
  id: string;
  registeredAt: Date;
  ingredient: {
    id: string;
    name: string;
    iconImageUrl: string | null;
    expiryDays: number;
  };
  remainingDays: number;
  status: ExpiryStatus;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toUtcDateOnly(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * 残り日数 = （登録日 + 対象食材マスターの現在の「賞味期限日数」）− 本日の日付。spec §3.1.3
 * マスターの expiryDays は呼び出し側が都度取得した最新値を渡すこと（スナップショット禁止）。
 */
export function computeRemainingDays(
  registeredAt: Date,
  expiryDays: number,
  today: Date = new Date()
): number {
  const daysSinceRegistered = (toUtcDateOnly(today) - toUtcDateOnly(registeredAt)) / MS_PER_DAY;
  return expiryDays - daysSinceRegistered;
}

/** 期限切れ(赤) < 0 ≤ 残り3日以内(黄) ≤ 3 < それ以外(通常). spec §3.1.3 */
export function expiryStatusOf(remainingDays: number): ExpiryStatus {
  if (remainingDays < 0) return "expired";
  if (remainingDays <= 3) return "soon";
  return "normal";
}

/** 在庫一覧: deleted_at IS NULL のものを賞味期限が近い順に。spec §3.1.3, §6 */
export async function listStockForUser(userId: string): Promise<StockListItem[]> {
  const rows = await prisma.stockItem.findMany({
    where: { userId, deletedAt: null },
    include: { ingredient: true },
  });

  const today = new Date();
  const items: StockListItem[] = rows.map((row) => {
    const remainingDays = computeRemainingDays(row.registeredAt, row.ingredient.expiryDays, today);
    return {
      id: row.id,
      registeredAt: row.registeredAt,
      ingredient: {
        id: row.ingredient.id,
        name: row.ingredient.name,
        iconImageUrl: row.ingredient.iconImageUrl,
        expiryDays: row.ingredient.expiryDays,
      },
      remainingDays,
      status: expiryStatusOf(remainingDays),
    };
  });

  items.sort((a, b) => a.remainingDays - b.remainingDays);
  return items;
}
