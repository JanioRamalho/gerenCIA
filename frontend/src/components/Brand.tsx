import BarsMark from "./BarsMark";

type BrandProps = {
  href?: string; // para onde o logotipo leva; o padrão é o início do site
  label?: string; // nome lido pelos leitores de tela
};

/** Logotipo do gerenCIA: o ladrilho menta com as três barras e o nome. */
export default function Brand({ href = "/", label = "gerenCIA, início" }: BrandProps) {
  return <a className="brand" href={href} aria-label={label} translate="no">
    <BarsMark />
    <span>geren<b>CIA</b></span>
  </a>;
}
