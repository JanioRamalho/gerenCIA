type BrandProps = {
  href?: string; // para onde o logotipo leva; o padrão é o início do site
  label?: string; // nome lido pelos leitores de tela
};

/** Logotipo do gerenCIA: o ladrilho menta com as três barras e o nome. */
export default function Brand({ href = "/", label = "gerenCIA, início" }: BrandProps) {
  return <a className="brand" href={href} aria-label={label} translate="no">
    <svg viewBox="0 0 30 29" fill="none" aria-hidden="true"><path d="M2 27h6l3-11H5L2 27Zm10 0h6l5-20h-6l-5 20Zm10 0h6l6-27h-6l-6 27Z" fill="currentColor" /></svg>
    <span>geren<b>CIA</b></span>
  </a>;
}
