import type { CSSProperties } from "react";
import { money } from "../../lib/format";

type Entry = { label: string; value: number | null; href?: string };

/** Direct labels keep both values available without a tooltip or color legend. */
export default function ComparisonBars({ entries, label }: { entries: Entry[]; label: string }) {
  const values = entries.flatMap((item) => item.value == null ? [] : [item.value]);
  const minimum = Math.min(0, ...values);
  const maximum = Math.max(0, ...values);
  const range = maximum - minimum || 1;
  const baseline = -minimum / range * 100;

  return <figure className="gc-comparison-bars" aria-label={label}>
    {entries.map((item, index) => {
      const value = item.value ?? 0;
      const height = Math.abs(value) / range * 100;
      const style = {
        "--bar-height": `${height}%`,
        "--bar-bottom": `${value < 0 ? baseline - height : baseline}%`,
        "--bar-baseline": `${baseline}%`,
      } as CSSProperties;
      const contents = <>
        <strong>{item.value == null ? "Sem dados" : money(item.value)}</strong>
        <span className="gc-comparison-plot" style={style} aria-hidden="true">
          <span className={`gc-comparison-fill${index ? " is-current" : ""}`} />
        </span>
        <span>{item.label}</span>
      </>;
      return item.href
        ? <a className="gc-comparison-column" key={item.label} href={item.href}>{contents}</a>
        : <div className="gc-comparison-column" key={item.label}>{contents}</div>;
    })}
  </figure>;
}
