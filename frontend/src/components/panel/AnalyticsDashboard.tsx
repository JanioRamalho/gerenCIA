import { useState, type CSSProperties } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money, percent, type AnalyticsData, type CategoryAnalysis } from "../../panel/api";
import { categoryPresentation } from "../../panel/categoryPresentation";
import Icon from "../Icon";
import CategoryMark from "./CategoryMark";
import ComparisonBars from "./ComparisonBars";
import ServicesSection from "./ServicesSection";
import { currentMonth, dayLabel, formatDate, monthLabel, shortMonth } from "./formatDate";

const currency = (value: string | number | null | undefined) => value == null ? "—" : money(Number(value));
const categoryKey = (item: { categoria: string; category_id?: string | null }) => `${item.category_id ?? "sem-id"}:${item.categoria}`;
const comparisonReason = (reason: string | null) => {
  if (reason === "base_nao_positiva") return "A base de referência é zero ou negativa.";
  if (reason === "referencia_ausente") return "Não há dados para o mês de referência.";
  if (reason === "visao_historica") return "A visão de todos os meses não possui comparação mensal.";
  return "Sem base para calcular o percentual.";
};
const transactionLink = (month: string | null, category?: string, merchant?: string, categoryId?: string | null, eligibility: "included" | "all" = "included") => {
  const query = new URLSearchParams({ eligibility });
  if (month) query.set("month", month);
  if (categoryId) query.set("category_id", categoryId);
  else if (category) query.set("uncategorized", "true");
  if (merchant) query.set("merchant", merchant);
  return `/app/transactions?${query}`;
};

type Props = {
  data: AnalyticsData; busy: boolean; failed: boolean; month: string; reference: string;
  onPeriodChange: (month: string, reference: string) => void; onRetry: () => void;
};

export default function AnalyticsDashboard({ data, busy, failed, month, reference, onPeriodChange, onRetry }: Props) {
  const summary = data.resumo;
  const current = data.mes;
  const comparison = data.comparacao;
  if (!summary) return <section className="panel-card panel-message">
    <h1>Análise indisponível neste período.</h1><p>Confira seus arquivos ou selecione outro mês.</p>
    <a className="gc-button" href="/app">Voltar ao período mais recente</a>
  </section>;
  const period = current ? monthLabel(current) : "Todos os meses";
  const temporal = current
    ? data.por_dia.map((item) => ({ label: dayLabel(item.data), total: item.total == null ? null : Number(item.total) }))
    : data.por_mes.map((item) => ({ label: item.rotulo, total: item.total == null ? null : Number(item.total) }));
  return <div className="panel-page gc-dashboard" aria-busy={busy}>
    <header className="gc-page-heading">
      <h1>Painel</h1>
      <div className="gc-header-actions">
        <label className="gc-period-control"><Icon name="calendar" size={18} />
          <select aria-label="Período da análise" value={month === "latest" ? current ?? "all" : month} onChange={(event) => onPeriodChange(event.target.value, reference)}>
            <option value="all">Todos os meses</option>
            {data.meses_disponiveis.map((item) => <option key={item} value={item}>{monthLabel(item)}</option>)}
          </select>
        </label>
        <a className="gc-button gc-button-primary" href="/app/files"><Icon name="upload" size={18} />Enviar arquivo</a>
      </div>
    </header>
    {failed ? <p className="pd-error" role="alert">Não foi possível atualizar esta análise. <button className="text-button" onClick={onRetry}>Tentar de novo</button></p> : null}
    <section className="gc-summary" aria-label={`Resumo de ${period}`}>
      <div className="gc-primary-metric">
        <span>Gasto líquido no período</span><strong>{currency(summary.total_saidas)}</strong>
        <p>{data.cobertura.mes_em_andamento ? "Mês em andamento" : period}</p>
      </div>
      <dl className="gc-summary-support">
        <div><dt>Despesas</dt><dd>{summary.quantidade_saidas}</dd></div>
        <div><dt>Média por dia</dt><dd>{currency(summary.media_por_dia)}</dd></div>
      </dl>
    </section>
    <div className="gc-main-grid">
      <CategoryBars key={current ?? "all"} categories={data.por_categoria} month={current} />
      <section className="gc-comparison" aria-labelledby="comparison-heading">
        <h2 id="comparison-heading">Comparar meses</h2>
        <label className="gc-reference-label"><span className="sr-only">Mês de referência</span>
          <select value={reference} disabled={!current} onChange={(event) => onPeriodChange(current ?? "all", event.target.value)}>
            <option value="">Escolher mês</option>
            {data.meses_disponiveis.filter((item) => item !== current).map((item) => <option key={item} value={item}>{monthLabel(item)}</option>)}
          </select>
        </label>
        {comparison?.mes_referencia && comparison.diferenca != null ? <>
          <ComparisonBars label="Gasto líquido dos dois meses; selecione um valor para conferir os lançamentos" entries={[
            { label: shortMonth(comparison.mes_referencia), value: comparison.total_referencia == null ? null : Number(comparison.total_referencia), href: transactionLink(comparison.mes_referencia) },
            { label: current ? shortMonth(current) : "Período", value: Number(comparison.total), href: transactionLink(current) },
          ]} />
          <p className="gc-comparison-delta"><strong>{Number(comparison.diferenca) > 0 ? "+" : ""}{currency(comparison.diferenca)}</strong>
            <span>{comparison.percentual == null ? comparisonReason(comparison.motivo) : `${percent(Math.abs(comparison.percentual), 1)} ${comparison.percentual > 0 ? "a mais" : comparison.percentual < 0 ? "a menos" : "de variação"}`}</span>
          </p>
          <details className="gc-details gc-category-comparison">
            <summary>Comparar por categoria <Icon name="arrow" size={16} /></summary>
            <div className="pd-scroll"><table className="pd-table">
              <caption className="sr-only">Gastos por categoria nos meses comparados</caption>
              <thead><tr><th>Categoria</th><th>{current ? shortMonth(current) : "Analisado"}</th><th>{shortMonth(comparison.mes_referencia)}</th><th>Diferença</th><th>Variação</th></tr></thead>
              <tbody>{comparison.por_categoria.map((item) => <tr key={categoryKey(item)}>
                <th scope="row">{item.categoria}</th>
                <td><a href={transactionLink(current, item.categoria, undefined, item.category_id)}>{currency(item.total)}</a></td>
                <td><a href={transactionLink(comparison.mes_referencia, item.categoria, undefined, item.category_id)}>{currency(item.total_referencia)}</a></td>
                <td>{currency(item.diferenca)}</td>
                <td>{item.percentual == null ? <>Indisponível<small>{comparisonReason(item.motivo)}</small></> : `${item.percentual > 0 ? "+" : ""}${percent(item.percentual, 1)}`}</td>
              </tr>)}</tbody>
            </table></div>
          </details>
          <p className="gc-footnote">A cobertura dos arquivos pode variar. Menor gasto observado não comprova economia.{reference === currentMonth() ? " A referência está em andamento." : ""}</p>
        </> : <p className="gc-comparison-empty">{current ? "Escolha outro mês disponível para comparar." : "Selecione um mês específico para comparar."}</p>}
      </section>
    </div>
    <ServicesSection data={data} reference={reference} />
    <details className="gc-additional-analysis gc-details">
      <summary>Mais análises e estatísticas <Icon name="arrow" size={18} /></summary>
    <section className="gc-surface" aria-labelledby="evolution-heading">
      <div className="gc-section-heading">
        <div>
          <h2 id="evolution-heading">O ritmo dos seus gastos</h2>
          <p>{current ? "Gasto líquido por dia no mês selecionado." : "Evolução mensal nos arquivos importados. Lacunas não representam gasto zero."}</p>
        </div>
        <span className="gc-small-tag">{current ? shortMonth(current) : "Histórico"}</span>
      </div>
      <div className="gc-evolution">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={temporal} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#e8eeeb" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={36} tick={{ fill: "#5b6f72", fontSize: 12 }} />
            <YAxis width={65} axisLine={false} tickLine={false} tickFormatter={(value: number) => new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(value)} tick={{ fill: "#5b6f72", fontSize: 12 }} />
            <Tooltip formatter={(value) => currency(Number(value))} />
            <Line dataKey="total" name="Gasto líquido" stroke="#21675e" strokeWidth={2.5} dot={temporal.length < 8} activeDot={{ r: 5 }} connectNulls={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <details className="gc-details">
        <summary>Ver valores da evolução <Icon name="arrow" size={16} />
        </summary>
        <ul className="gc-temporal-values">{temporal.map((item) => <li key={item.label}>
          <span>{item.label}</span>
          <strong>{currency(item.total)}</strong>
        </li>)}</ul>
      </details>
    </section>

    <section className="gc-analysis-details" aria-labelledby="analysis-details-heading">
      <h2 id="analysis-details-heading">Mais contexto para decidir</h2>
      <p>Explore as medidas e os movimentos que compõem esta análise.</p>
      <AnalysisDetails data={data} />
      <details className="gc-details gc-surface">
        <summary>Estatísticas por categoria <Icon name="arrow" size={18} /></summary>
        <p className="gc-footnote">As medidas de valores consideram compras e tarifas elegíveis. Gasto líquido e participação mantêm os estornos na composição.</p>
        {data.por_categoria.map((item) => <details className="gc-details gc-category-statistics" key={categoryKey(item)}>
          <summary><span className="gc-inline-category"><CategoryMark name={item.categoria} compact />{item.categoria}</span><strong>{currency(item.total)}</strong></summary>
          {item.estatisticas ? <>
            <p className="gc-footnote">{item.estatisticas.quantidade} despesas · {item.participacao == null ? "Participação indisponível" : `${percent(item.participacao)} do gasto líquido`}.</p>
            <dl className="gc-statistics">{([
              ["Média", item.estatisticas.media], ["Mediana", item.estatisticas.mediana],
              ["Mínimo", item.estatisticas.minimo], ["Máximo", item.estatisticas.maximo],
              ["Amplitude", item.estatisticas.amplitude], ["Desvio padrão", item.estatisticas.desvio_padrao],
              ["Primeiro quartil", item.estatisticas.q1], ["Terceiro quartil", item.estatisticas.q3],
              ["Intervalo interquartil", item.estatisticas.iqr],
            ] as const).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{currency(value)}</dd></div>)}</dl>
            <p className="gc-footnote">Estabelecimentos mais frequentes: {item.estatisticas.moda_estabelecimento.join(", ") || "Sem dados"}. {item.estatisticas.motivo_dispersao ? "Dados insuficientes para as medidas de dispersão." : ""}</p>
            <ul className="gc-temporal-values">{item.estatisticas.histograma.map((range) => <li key={`${range.inicio}-${range.fim}`}><span>{currency(range.inicio)} a {currency(range.fim)}</span><strong>{range.quantidade} despesas</strong></li>)}</ul>
          </> : <p className="pd-empty">Estatísticas indisponíveis para esta categoria.</p>}
        </details>)}
      </details>
      <details className="gc-details gc-surface">
        <summary>Estatísticas das despesas <Icon name="arrow" size={18} />
        </summary>
        <p className="gc-footnote">{data.estatisticas.quantidade} compras e tarifas elegíveis. Estornos, receitas e pagamentos não compõem estas medidas.</p>
        <dl className="gc-statistics">{([["Média", data.estatisticas.media], ["Mediana", data.estatisticas.mediana], ["Menor despesa", data.estatisticas.minimo], ["Maior despesa", data.estatisticas.maximo], ["Amplitude", data.estatisticas.amplitude], ["Desvio padrão", data.estatisticas.desvio_padrao], ["Primeiro quartil", data.estatisticas.q1], ["Terceiro quartil", data.estatisticas.q3], ["Intervalo interquartil", data.estatisticas.iqr]] as const).map(([label, value]) => <div key={label}>
          <dt>{label}</dt>
          <dd>{currency(value)}</dd>
        </div>)}</dl>{data.estatisticas.motivo_dispersao ? <p className="gc-footnote">São necessárias pelo menos quatro despesas para as medidas de dispersão.</p> : null}<p className="gc-footnote">Categorias mais frequentes: {data.estatisticas.moda_categoria.join(", ") || "Sem dados"}. Estabelecimentos mais frequentes: {data.estatisticas.moda_estabelecimento.join(", ") || "Sem dados"}.</p>
      </details>
      <details className="gc-details gc-surface">
        <summary>Entradas, pagamentos e composição do gasto <Icon name="arrow" size={18} />
        </summary>
        <dl className="gc-statistics">
          <div>
            <dt>Compras</dt>
            <dd>{currency(summary.total_compras)}</dd>
          </div>
          <div>
            <dt>Tarifas</dt>
            <dd>{currency(summary.total_tarifas)}</dd>
          </div>
          <div>
            <dt>Estornos</dt>
            <dd>{currency(summary.total_estornos)}</dd>
          </div>
          <div>
            <dt>Entradas</dt>
            <dd>{currency(summary.total_entradas)}</dd>
          </div>
          <div>
            <dt>Pagamentos de fatura</dt>
            <dd>{currency(summary.total_pagamentos)}</dd>
          </div>
        </dl>
        <p className="gc-footnote">Entradas e pagamentos ficam separados do gasto por categoria. Estes dados não representam seu saldo bancário.</p>
      </details>
    </section>
    </details>
    <section className="gc-recent gc-open-section" aria-labelledby="recent-heading">
      <div className="gc-section-heading">
        <h2 id="recent-heading">Últimos lançamentos</h2>
        <a className="text-link" href={transactionLink(current, undefined, undefined, undefined, "all")}>Ver tudo <Icon name="arrow" size={16} /></a>
      </div>
      {data.recentes.length ? <table className="gc-recent-table">
        <caption className="sr-only">Até cinco lançamentos mais recentes de {period}</caption>
        <thead><tr><th>Data</th><th>Estabelecimento</th><th>Categoria</th><th>Valor</th></tr></thead>
        <tbody>{data.recentes.slice(0, 5).map((item, index) => <tr key={item.id ?? `${item.data}-${index}`}>
          <td>{dayLabel(item.data)}</td><td>{item.estabelecimento || item.descricao}</td>
          <td><span className="gc-category-dot" style={{ background: categoryPresentation(item.categoria).color }} />{item.categoria}</td>
          <td>{currency(item.valor)}</td>
        </tr>)}</tbody>
      </table> : <p className="pd-empty">Nenhum lançamento neste período.</p>}
    </section>
    <p className="gc-data-note">{data.cobertura.inicio && data.cobertura.fim ? `Lançamentos observados de ${formatDate(`${data.cobertura.inicio}T12:00:00`)} a ${formatDate(`${data.cobertura.fim}T12:00:00`)}. ` : ""}A análise representa os arquivos importados, que podem não cobrir todas as movimentações da conta.</p>
  </div>;
}

function CategoryBars({ categories, month }: { categories: CategoryAnalysis[]; month: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? categories : categories.slice(0, 5);
  const maximum = Math.max(1, ...categories.map((item) => Math.abs(Number(item.total))));
  const diverging = categories.some((item) => Number(item.total) < 0);
  return <section className="gc-categories" aria-labelledby="categories-heading">
    <div className="gc-section-heading"><div><h2 id="categories-heading">Para onde foi o dinheiro</h2>
      <p>{categories.length > 5 && !expanded ? "5 maiores categorias" : "Distribuição por categoria"}</p></div></div>
    {categories.length ? <>
      <ul className="gc-category-bars" id="category-values">
        {visible.map((item) => {
          const value = Number(item.total);
          const width = Math.abs(value) / maximum * (diverging ? 50 : 100);
          const style = { "--category-color": categoryPresentation(item.categoria).color,
            "--category-width": `${width}%`, "--category-left": `${diverging ? value < 0 ? 50 - width : 50 : 0}%`,
          } as CSSProperties;
          return <li key={categoryKey(item)} style={style}>
            <a href={transactionLink(month, item.categoria, undefined, item.category_id)} title={item.participacao == null ? undefined : `${percent(item.participacao)} do gasto líquido`}>
              <span>{item.categoria}</span><span className={`gc-category-plot${diverging ? " is-diverging" : ""}`} aria-hidden="true"><i /></span><strong>{currency(item.total)}</strong>
            </a>
          </li>;
        })}
      </ul>
      {categories.length > 5 ? <button className="text-button gc-category-expand" aria-expanded={expanded} aria-controls="category-values" onClick={() => setExpanded((value) => !value)}>
        {expanded ? "Mostrar as 5 maiores" : `Ver todas as ${categories.length} categorias`}<Icon name="arrow" size={16} />
      </button> : null}
    </> : <p className="pd-empty">Nenhuma categoria com movimentação neste período.</p>}
  </section>;
}

function AnalysisDetails({ data }: { data: AnalyticsData }) {
  const histogram = data.estatisticas.histograma.map((item) => ({
    label: `${currency(item.inicio)} a ${currency(item.fim)}`,
    quantidade: item.quantidade,
  }));
  const validComposition = data.por_categoria.length > 0 && data.por_categoria.every((item) => item.participacao != null);
  return <>
    <details className="gc-details gc-surface">
      <summary>Distribuição e composição das despesas <Icon name="arrow" size={18} />
      </summary>
      <p className="gc-footnote">Quantidade de compras e tarifas em cada faixa de valor.</p>
      {histogram.length ? <>
        <div className="gc-evolution">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogram} margin={{ top: 25, right: 15, bottom: 15, left: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} width={35} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Bar dataKey="quantidade" name="Despesas" fill="#507e70" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                <LabelList dataKey="quantidade" position="top" fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="gc-temporal-values">{histogram.map((item) => <li key={item.label}>
          <span>{item.label}</span>
          <strong>{item.quantidade} despesas</strong>
        </li>)}</ul>
      </> : <p className="pd-empty">Sem despesas para construir a distribuição.</p>}
      {validComposition ? <div className="gc-composition">
        <div className="gc-composition-chart">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.por_categoria.map((item) => ({ ...item, plot: Number(item.total) }))} dataKey="plot" nameKey="categoria" innerRadius={52} outerRadius={76} paddingAngle={3} isAnimationActive={false}>
                {data.por_categoria.map((item) => <Cell key={categoryKey(item)} fill={categoryPresentation(item.categoria).color} />)}
              </Pie>
              <Tooltip formatter={(value) => currency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul>{data.por_categoria.map((item) => <li key={categoryKey(item)}>
          <CategoryMark name={item.categoria} compact />
          <span>{item.categoria}</span>
          <strong>{percent(item.participacao ?? 0)}</strong>
        </li>)}</ul>
      </div> : <p className="gc-footnote">Composição percentual indisponível quando os valores não representam uma divisão válida do total.</p>}
    </details>
    <details className="gc-details gc-surface">
      <summary>Estabelecimentos e maiores despesas <Icon name="arrow" size={18} />
      </summary>
      <div className="pd-scroll">
        <table className="pd-table">
          <caption>Gasto e frequência por estabelecimento</caption>
          <thead>
            <tr>
              <th>Estabelecimento</th>
              <th>Gasto líquido</th>
              <th>Lançamentos</th>
            </tr>
          </thead>
          <tbody>{data.por_estabelecimento.map((item) => <tr key={item.estabelecimento}>
            <td>
              <a href={transactionLink(data.mes, undefined, item.estabelecimento)}>{item.estabelecimento}</a>
            </td>
            <td>{currency(item.total)}</td>
            <td>{item.quantidade}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <h3 className="gc-detail-title">Maiores despesas</h3>
      <ul className="gc-recent-list">{data.maiores_lancamentos.map((item, index) => <li key={item.id ?? `${item.data}-${index}`}>
        <CategoryMark name={item.categoria} />
        <div>
          <strong>{item.estabelecimento}</strong>
          <span>{dayLabel(item.data)} · {item.categoria}</span>
        </div>
        <b>{currency(item.valor)}</b>
      </li>)}</ul>
    </details>
  </>;
}
