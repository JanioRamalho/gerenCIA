type Direction = "right" | "left" | "up" | "diagonal";

export default function UiArrow({ direction = "right" }: { direction?: Direction }) {
  const path = direction === "left" ? "M17 10H3m5 5-5-5 5-5"
    : direction === "up" ? "M10 17V3m-5 5 5-5 5 5"
      : direction === "diagonal" ? "M5 15 15 5M6 5h9v9"
        : "M3 10h14m-5-5 5 5-5 5";
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d={path} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
