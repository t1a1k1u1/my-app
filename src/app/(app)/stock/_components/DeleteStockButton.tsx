"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteStockButton({ id, label }: { id: string; label: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`「${label}」を削除しますか？`)) return;
    setDeleting(true);
    const res = await fetch(`/api/stock/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("削除に失敗しました");
      setDeleting(false);
      return;
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="shrink-0 rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
    >
      {deleting ? "削除中..." : "削除"}
    </button>
  );
}
