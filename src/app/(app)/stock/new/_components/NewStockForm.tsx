"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type IngredientOption = {
  id: string;
  name: string;
  iconImageUrl: string | null;
  aliases: string[];
};

function todayISODate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function NewStockForm() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [frequent, setFrequent] = useState<IngredientOption[]>([]);
  const [recent, setRecent] = useState<IngredientOption[]>([]);
  const [results, setResults] = useState<IngredientOption[]>([]);

  const [selected, setSelected] = useState<IngredientOption | null>(null);
  const [registeredAt, setRegisteredAt] = useState(todayISODate());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedQuery = query.trim();
  const loadingSuggestions = trimmedQuery.length > 0 && trimmedQuery !== debouncedQuery.trim();

  // 検索欄が空のときのデフォルト候補（よく登録するもの / 最近登録したもの）。spec §3.1.2
  useEffect(() => {
    Promise.all([
      fetch("/api/ingredients/search?mode=frequent").then((r) => r.json()),
      fetch("/api/ingredients/search?mode=recent").then((r) => r.json()),
    ])
      .then(([f, r]) => {
        setFrequent(f);
        setRecent(r);
      })
      .catch(() => {});
  }, []);

  // 入力のデバウンス
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(timer);
  }, [query]);

  // インクリメンタル検索。spec §3.1.2
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) return;

    let cancelled = false;
    fetch(`/api/ingredients/search?q=${encodeURIComponent(trimmed)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredientId: selected.id, registeredAt }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "登録に失敗しました");
      }
      router.push("/stock");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
      setSubmitting(false);
    }
  }

  if (selected) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selected.iconImageUrl ?? "/icons/ingredient-placeholder.svg"}
            alt=""
            className="h-12 w-12 shrink-0 rounded-md border border-neutral-200 object-cover"
          />
          <div className="min-w-0 flex-1 font-medium text-neutral-900">{selected.name}</div>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="shrink-0 text-sm text-neutral-600 hover:underline"
          >
            選び直す
          </button>
        </div>

        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          登録日
          <input
            type="date"
            required
            value={registeredAt}
            onChange={(e) => setRegisteredAt(e.target.value)}
            className="w-48 rounded-md border border-neutral-300 px-3 py-2 text-base outline-none focus:border-neutral-500"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {submitting ? "登録中..." : "在庫に登録"}
        </button>
      </form>
    );
  }

  const showDefaultSuggestions = query.trim().length === 0;

  return (
    <div className="flex flex-col gap-5">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="食材名で検索"
        autoFocus
        className="rounded-md border border-neutral-300 px-3 py-2 text-base outline-none focus:border-neutral-500"
      />

      {showDefaultSuggestions ? (
        <div className="flex flex-col gap-5">
          <IngredientSuggestionSection title="よく登録するもの" items={frequent} onSelect={setSelected} />
          <IngredientSuggestionSection title="最近登録したもの" items={recent} onSelect={setSelected} />
        </div>
      ) : (
        <IngredientSuggestionSection
          title={loadingSuggestions ? "検索中..." : "検索結果"}
          items={results}
          onSelect={setSelected}
          emptyText="該当する食材が見つかりません"
        />
      )}
    </div>
  );
}

function IngredientSuggestionSection({
  title,
  items,
  onSelect,
  emptyText,
}: {
  title: string;
  items: IngredientOption[];
  onSelect: (ingredient: IngredientOption) => void;
  emptyText?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-neutral-700">{title}</h2>
      {items.length === 0 ? (
        emptyText && <p className="text-sm text-neutral-400">{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((ingredient) => (
            <li key={ingredient.id}>
              <button
                type="button"
                onClick={() => onSelect(ingredient)}
                className="flex w-full items-center gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left hover:bg-neutral-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ingredient.iconImageUrl ?? "/icons/ingredient-placeholder.svg"}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-md border border-neutral-200 object-cover"
                />
                <span className="min-w-0 flex-1 truncate font-medium text-neutral-900">
                  {ingredient.name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
