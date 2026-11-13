import Icon from "../Icon";

/** Sem dados pessoais, o painel explica o próximo passo e não inventa valores. */
export default function PanelEmptyState() {
  const metrics = ["Despesas do período", "Entradas do período", "Transações", "Maior despesa"];
  return <>
    <section className="panel-section" aria-labelledby="overview-title">
      <div className="panel-section-heading">
        <h2 id="overview-title">Visão geral</h2>
        <p className="panel-period">Período ainda não disponível</p>
      </div>
      <dl className="panel-metrics">{metrics.map((label) => <div className="panel-card" key={label}>
        <dt>{label}</dt><dd>—</dd><dd className="panel-metric-note">Aguardando arquivo</dd>
      </div>)}</dl>
    </section>
    <div className="panel-charts">
      <EmptyChart id="timeline-title" title="Evolução das despesas" icon="columns"
        heading="Acompanhe seus gastos ao longo do tempo."
        text="Envie um arquivo para consultar suas despesas por mês." />
      <EmptyChart id="categories-title" title="Despesas por categoria" icon="tags"
        heading="Veja para onde vai o seu dinheiro."
        text="As categorias dos seus lançamentos aparecerão aqui após o envio." />
    </div>
  </>;
}

function EmptyChart({ id, title, icon, heading, text }: {
  id: string; title: string; icon: "columns" | "tags"; heading: string; text: string;
}) {
  return <section className="panel-section" aria-labelledby={id}>
    <div className="panel-section-heading"><h2 id={id}>{title}</h2></div>
    <div className="panel-card panel-chart-card"><div className="panel-chart-empty">
      <span className="panel-empty-icon"><Icon name={icon} size={28} /></span>
      <h3>{heading}</h3><p>{text}</p>
    </div></div>
  </section>;
}
