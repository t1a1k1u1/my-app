import Link from "next/link";
import { auth } from "@/lib/auth";
import { listStockForUser, type ExpiryStatus } from "@/lib/stock";
import { DeleteStockButton } from "./_components/DeleteStockButton";

const STATUS_STYLES: Record<ExpiryStatus, string> = {
  expired: "border-red-300 bg-red-50",
  soon: "border-yellow-300 bg-yellow-50",
  normal: "border-neutral-200 bg-white",
};

const STATUS_TEXT_STYLES: Record<ExpiryStatus, string> = {
  expired: "text-red-700",
  soon: "text-yellow-700",
  normal: "text-neutral-500",
};

function formatRemainingDays(remainingDays: number): string {
  const days = Math.round(remainingDays);
  if (days < 0) return `期限切れ（${-days}日経過）`;
  if (days === 0) return "本日が期限";
  return `あと${days}日`;
}

export default async function StockPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const items = await listStockForUser(userId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900">在庫一覧</h1>
        <Link
          href="/stock/new"
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          + 登録
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-neutral-500">在庫がありません。「+ 登録」から追加してください。</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${STATUS_STYLES[item.status]}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.ingredient.iconImageUrl ?? "/icons/ingredient-placeholder.svg"}
                alt=""
                className="h-10 w-10 shrink-0 rounded-md border border-neutral-200 bg-white object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-neutral-900">{item.ingredient.name}</div>
                <div className={`text-sm ${STATUS_TEXT_STYLES[item.status]}`}>
                  {formatRemainingDays(item.remainingDays)}
                </div>
              </div>
              <DeleteStockButton id={item.id} label={item.ingredient.name} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
