import Link from "next/link";
import { listIngredientsForAdmin } from "@/lib/ingredients";

export default async function AdminIngredientsPage(props: PageProps<"/admin/ingredients">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const ingredients = await listIngredientsForAdmin(q);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900">食材マスター</h1>
        <Link
          href="/admin/ingredients/new"
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          + 新規登録
        </Link>
      </div>

      <form method="GET" className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="食材名・別名で検索"
          className="w-full max-w-sm rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
        >
          検索
        </button>
      </form>

      {ingredients.length === 0 ? (
        <p className="text-sm text-neutral-500">
          {q ? "該当する食材がありません" : "食材が登録されていません"}
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
          {ingredients.map((ingredient) => (
            <li key={ingredient.id} className="flex items-center gap-3 px-4 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- ローカル/外部いずれのURLも許容するため next/image のドメイン制約を避ける */}
              <img
                src={ingredient.iconImageUrl ?? "/icons/ingredient-placeholder.svg"}
                alt=""
                className="h-10 w-10 shrink-0 rounded-md border border-neutral-200 bg-neutral-50 object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-neutral-900">{ingredient.name}</span>
                  {!ingredient.isActive && (
                    <span className="shrink-0 rounded bg-neutral-200 px-1.5 py-0.5 text-xs text-neutral-600">
                      無効化済み
                    </span>
                  )}
                </div>
                <div className="truncate text-xs text-neutral-500">
                  賞味期限 {ingredient.expiryDays}日
                  {ingredient.aliases.length > 0 && ` ・ 別名: ${ingredient.aliases.join(", ")}`}
                </div>
              </div>
              <Link
                href={`/admin/ingredients/${ingredient.id}/edit`}
                className="shrink-0 text-sm text-neutral-600 hover:text-neutral-900 hover:underline"
              >
                編集
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
