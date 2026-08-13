import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "たべごろ",
    short_name: "たべごろ",
    description: "冷蔵庫の中身を可視化し、賞味期限を考慮しながら食材を使い切るための食材在庫管理アプリ",
    start_url: "/stock",
    display: "standalone",
    background_color: "#FAFAF9",
    theme_color: "#EA580C",
    lang: "ja",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
    ],
  };
}
