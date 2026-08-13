"use client";

import { useEffect } from "react";

/** ホーム画面追加(PWA)対応のため、静的アセット用の最小限のService Workerを登録する。 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
