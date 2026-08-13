import type { CSSProperties } from "react";

/** Shared visual for all generated app icons (favicon, apple-touch-icon, manifest icons). */
export function AppIconGlyph({ size }: { size: number }) {
  const style: CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#EA580C",
    color: "white",
    fontSize: size * 0.6,
    fontWeight: 700,
    fontFamily: "sans-serif",
    borderRadius: size * 0.2,
  };
  return <div style={style}>た</div>;
}
