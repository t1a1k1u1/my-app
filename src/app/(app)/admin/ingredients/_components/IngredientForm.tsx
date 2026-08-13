"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type IngredientFormInitialData = {
  id: string;
  name: string;
  expiryDays: number;
  aliases: string[];
  iconImageUrl: string | null;
  isActive: boolean;
};

async function parseErrorMessage(response: Response): Promise<string> {
  const body = await response.json().catch(() => null);
  const fieldErrors = body?.error?.fieldErrors as Record<string, string[]> | undefined;
  const firstFieldError = fieldErrors && Object.values(fieldErrors).flat()[0];
  return firstFieldError ?? body?.error ?? "保存に失敗しました";
}

export function IngredientForm({ initialData }: { initialData?: IngredientFormInitialData }) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [name, setName] = useState(initialData?.name ?? "");
  const [expiryDays, setExpiryDays] = useState(String(initialData?.expiryDays ?? ""));
  const [aliases, setAliases] = useState<string[]>(
    initialData?.aliases && initialData.aliases.length > 0 ? initialData.aliases : [""]
  );
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(initialData?.iconImageUrl ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleIconChange(file: File | null) {
    setIconFile(file);
    setIconPreview(file ? URL.createObjectURL(file) : (initialData?.iconImageUrl ?? null));
  }

  function updateAlias(index: number, value: string) {
    setAliases((prev) => prev.map((a, i) => (i === index ? value : a)));
  }

  function removeAlias(index: number) {
    setAliases((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadIconIfNeeded(ingredientId: string) {
    if (!iconFile) return;
    const formData = new FormData();
    formData.append("file", iconFile);
    const res = await fetch(`/api/ingredients/${ingredientId}/icon`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        name,
        expiryDays: Number(expiryDays),
        aliases: aliases.map((a) => a.trim()).filter((a) => a.length > 0),
      };

      const res = await fetch(isEdit ? `/api/ingredients/${initialData.id}` : "/api/ingredients", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res));
      }
      const saved = await res.json();
      await uploadIconIfNeeded(isEdit ? initialData.id : saved.id);

      router.push("/admin/ingredients");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!initialData) return;
    if (!confirm(`「${initialData.name}」を削除しますか？`)) return;
    setError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/ingredients/${initialData.id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res));
      }
      router.push("/admin/ingredients");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {isEdit && !initialData.isActive && (
        <p className="rounded-md bg-neutral-100 px-3 py-2 text-sm text-neutral-600">
          この食材は無効化済みです（在庫からの参照が残っているため物理削除されていません）
        </p>
      )}

      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconPreview ?? "/icons/ingredient-placeholder.svg"}
          alt=""
          className="h-16 w-16 shrink-0 rounded-md border border-neutral-200 bg-neutral-50 object-cover"
        />
        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          アイコン画像
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            onChange={(e) => handleIconChange(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-neutral-700">
        食材名
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-base outline-none focus:border-neutral-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-neutral-700">
        賞味期限（日数）
        <input
          type="number"
          required
          min={0}
          step={1}
          value={expiryDays}
          onChange={(e) => setExpiryDays(e.target.value)}
          className="w-32 rounded-md border border-neutral-300 px-3 py-2 text-base outline-none focus:border-neutral-500"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-neutral-700">別名（検索用シノニム）</span>
        {aliases.map((alias, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={alias}
              onChange={(e) => updateAlias(index, e.target.value)}
              className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-base outline-none focus:border-neutral-500"
            />
            <button
              type="button"
              onClick={() => removeAlias(index)}
              className="rounded-md border border-neutral-300 px-2 text-sm text-neutral-500 hover:bg-neutral-100"
              aria-label="別名を削除"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setAliases((prev) => [...prev, ""])}
          className="self-start text-sm text-neutral-600 hover:text-neutral-900 hover:underline"
        >
          + 別名を追加
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {submitting ? "保存中..." : "保存"}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-red-600 hover:underline disabled:opacity-50"
          >
            {deleting ? "削除中..." : "削除"}
          </button>
        )}
      </div>
    </form>
  );
}
