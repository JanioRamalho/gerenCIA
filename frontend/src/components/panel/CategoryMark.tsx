import { categoryPresentation } from "../../panel/categoryPresentation";
import Icon from "../Icon";

export default function CategoryMark({ name, compact = false }: { name: string; compact?: boolean }) {
  const style = categoryPresentation(name);
  return <span className={`gc-category-mark${compact ? " is-compact" : ""}`} style={{ color: style.color, background: style.wash }}>
    <Icon name={style.icon} size={compact ? 17 : 21} />
  </span>;
}
