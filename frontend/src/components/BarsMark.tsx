/**
 * O símbolo das três barras do logotipo. Ele aparece no logotipo e, grande e
 * esmaecido, como enfeite. A cor vem do CSS, pela propriedade fill.
 */
export default function BarsMark({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 30 29" aria-hidden="true"><path d="M2 27h6l3-11H5L2 27Zm10 0h6l5-20h-6l-5 20Zm10 0h6l6-27h-6l-6 27Z" /></svg>;
}
