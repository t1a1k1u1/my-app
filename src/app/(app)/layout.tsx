import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/lib/auth";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/stock" className="text-base font-semibold text-neutral-900">
            たべごろ
          </Link>
          <nav className="flex items-center gap-4 text-sm text-neutral-600">
            <Link href="/stock" className="hover:text-neutral-900">
              在庫一覧
            </Link>
            <Link href="/admin/ingredients" className="hover:text-neutral-900">
              食材マスター
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button type="submit" className="hover:text-neutral-900">
                ログアウト
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
