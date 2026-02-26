"use client";

/**
 * Service Worker 登録コンポーネント
 * @serwist/window を使用したPWA対応
 */

import { useEffect } from "react";
import { Serwist } from "@serwist/window";

interface SerwistRegisterProps {
  children: React.ReactNode;
}

export function SerwistRegister({ children }: SerwistRegisterProps) {
  useEffect(() => {
    // 本番環境のみService Workerを登録
    if (
      process.env.NODE_ENV === "production" &&
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      const sw = new Serwist("/serwist/sw.js", {
        scope: "/",
        type: "classic",
      });

      sw.register();
    }
  }, []);

  return <>{children}</>;
}
