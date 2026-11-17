import { Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { User } from "../../auth/api";
import { money, percent, type AnalyticsData } from "../../panel/api";
import { categoryPresentation } from "../../panel/categoryPresentation";
import Icon from "../Icon";
import CategoryMark from "./CategoryMark";
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
  return `/app/transactions${query.size ? `?${query}` : ""}`;
};

type Props = {
  user: User;
  data: AnalyticsData;
  busy: boolean;
  failed: boolean;
  month: string;
  reference: string;
  onPeriodChange: (month: string, reference: string) => void;
  onRetry: () => void;
};

export default function AnalyticsDashboard({ user, data, busy, failed, month, reference, onPeriodChange, onRetry }: Props) {
  const summary = data.resumo;
  const current = data.mes;
  const categories = data.por_categoria;
  const comparison = data.comparacao;
  if (!summary) return <section className="panel-card panel-message">
    <h1>Análise indisponível neste período.</h1>
    <p>Não há resumo para os dados selecionados. Confira seus arquivos ou selecione outro mês.</p>
    <a className="gc-button" href="/app">Voltar ao período mais recente</a>
  </section>;
  const period = current ? monthLabel(current) : "Todos os meses";
  const temporal = current ? data.por_dia.map((item) => ({ label: dayLabel(item.data), total: item.total == null ? null : Number(item.total) })) : data.por_mes.map((item) => ({ label: item.rotulo, total: item.total == null ? null : Number(item.total) }));
  return <div className="panel-page gc-dashboard" aria-busy={busy}>
    <header className="gc-page-heading">
      <div>
        <p className="gc-greeting">Olá, {user.name.split(" ")[0]}.</p>
        <h1>Seu dinheiro, em perspectiva.</h1>
        <p>Entenda os gastos. Encontre o que vale revisar.</p>
      </div>
      <a className="gc-button" href="/app/files">
        <Icon name="upload" size={18} /> Enviar arquivo</a>
    </header>

    <div className="gc-period-bar">
      <label>
        <Icon name="calendar" size={18} />
        <span>Período</span>
        <select aria-label="Período da análise" value={month === "latest" ? current ?? "all" : month} onChange={(event) => onPeriodChange(event.target.value, reference)}>
          <option value="all">Todos os meses</option>{data.meses_disponiveis.map((item) => <option key={item} value={item}>{monthLabel(item)}</option>)}</select>
      </label>
      <p>
        <span className="gc-status-dot" />Dados dos arquivos importados{data.cobertura.mes_em_andamento ? " · mês em andamento" : ""}</p>
    </div>

    {failed ? <p className="pd-error" role="alert">Não foi possível atualizar esta análise. <button className="text-button" type="button" onClick={onRetry}>Tentar de novo</button>
    </p> : null}

    <section className="gc-summary" aria-label={`Resumo de ${period}`}>
      <div className="gc-primary-metric">
        <span>Gasto líquido em {current ? shortMonth(current) : "todos os meses"}</span>
        <strong>{currency(summary.total_saidas)}</strong>
        <p>Compras e tarifas, descontados os estornos.</p>
        {data.cobertura.mes_em_andamento ? <p className="gc-period-note">Mês em andamento: os valores ainda podem mudar.</p> : null}
      </div>
      <dl className="gc-summary-support">
        <div>
          <dt>Despesas</dt>
          <dd>{summary.quantidade_saidas}<small>compras e tarifas</small>
          </dd>
        </div>
        <div>
          <dt>Média por dia</dt>
          <dd>{currency(summary.media_por_dia)}<small>nos dados importados</small>
          </dd>
        </div>
        <div>
          <dt>Maior categoria</dt>
          <dd className="gc-top-category">{summary.maior_categoria ? <>
            <CategoryMark name={summary.maior_categoria} compact />{summary.maior_categoria}</> : "Sem gasto positivo"}</dd>
        </div>
      </dl>
    </section>

    <div className="gc-main-grid">
      <section className="gc-surface gc-categories" aria-labelledby="categories-heading">
        <div className="gc-section-heading">
          <div>
            <h2 id="categories-heading">Para onde foi o dinheiro</h2>
            <p>Cada categoria conta uma parte da história.</p>
          </div>
          <Icon name="tags" size={22} />
        </div>
        {categories.length ? <>
          <div className="gc-category-chart" style={{ height: Math.max(240, categories.length * 49) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={categories.map((item) => ({ ...item, plot: Number(item.total) }))} margin={{ top: 5, right: 80, bottom: 5, left: 0 }} barSize={13}>
                <XAxis type="number" hide />
                <YAxis dataKey="categoria" type="category" width={142} axisLine={false} tickLine={false} tick={({ x, y, payload, index }) => {
                  const item = categories[index];
                  return <g transform={`translate(${Number(x) - 136},${Number(y) - 11})`}>
                    <foreignObject width="25" height="25">
                      <CategoryMark name={String(payload.value)} compact />
                    </foreignObject>
                    <text x="34" y="16" fill="#233e43" fontSize="13">{String(payload.value)}</text>
                    <text x="34" y="29" fill="#607376" fontSize="10">{item?.participacao != null ? percent(item.participacao) : ""}</text>
                  </g>;
                }} />
                <Tooltip cursor={{ fill: "#f3f7f5" }} formatter={(value) => currency(Number(value))} labelStyle={{ fontWeight: 600 }} />
                <Bar dataKey="plot" name="Gasto líquido" radius={5} isAnimationActive={false} onClick={(_, index) => {
                  const item = categories[index];
                  if (item) window.location.assign(transactionLink(current, item.categoria, undefined, item.category_id));
                }}>
                  <LabelList dataKey="plot" position="right" formatter={(value: unknown) => currency(Number(value))} style={{ fill: "#354e50", fontSize: 12 }} />{categories.map((item) => <Cell key={categoryKey(item)} fill={categoryPresentation(item.categoria).color} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <details className="gc-details gc-values">
            <summary>Conferir valores e investigar categorias <Icon name="arrow" size={16} />
            </summary>
            <ul>{categories.map((item) => <li key={categoryKey(item)}>
              <a href={transactionLink(current, item.categoria, undefined, item.category_id)}>
                <span>
                  <CategoryMark name={item.categoria} compact />{item.categoria}</span>
                <strong>{currency(item.total)}</strong>
                <small>{item.participacao == null ? "Sem percentual" : percent(item.participacao)}</small>
                <Icon name="arrow" size={16} />
              </a>
            </li>)}</ul>
          </details>
        </> : <p className="pd-empty">Nenhuma categoria com movimentação neste período.</p>}
      </section>

      <section className="gc-surface gc-comparison" aria-labelledby="comparison-heading">
        <div className="gc-section-heading">
          <div>
            <h2 id="comparison-heading">Um mês ao lado do outro</h2>
            <p>Escolha a referência da sua comparação.</p>
          </div>
          <Icon name="columns" size={22} />
        </div>
        <label className="gc-reference-label">Comparar com<select value={reference} disabled={!current} onChange={(event) => onPeriodChange(month === "latest" ? current ?? "all" : month, event.target.value)}>
          <option value="">Escolher mês</option>{data.meses_disponiveis.filter((item) => item !== current).map((item) => <option key={item} value={item}>{monthLabel(item)}</option>)}</select>
        </label>
        {reference === currentMonth() ? <p className="gc-footnote">O mês de referência está em andamento.</p> : null}
        {comparison?.mes_referencia && comparison.diferenca != null ? <>
          <div className="gc-difference">
            <strong>{currency(comparison.diferenca)}</strong>
            <span>{comparison.percentual == null ? "Percentual indisponível: base não positiva." : `${comparison.percentual > 0 ? "+" : ""}${percent(comparison.percentual, 1)} em relação à referência`}</span>
          </div>
          <div className="gc-compare-totals">
            <a href={transactionLink(current)}>
              <span>{current ? shortMonth(current) : "Período"}</span>
              <strong>{currency(comparison.total)}</strong>
            </a>
            <a href={transactionLink(comparison.mes_referencia)}>
              <span>{shortMonth(comparison.mes_referencia)}</span>
              <strong>{currency(comparison.total_referencia)}</strong>
            </a>
          </div>
          <details className="gc-details">
            <summary>Comparar por categoria <Icon name="arrow" size={16} />
            </summary>
            <div className="pd-scroll">
              <table className="pd-table">
                <caption className="sr-only">Comparação de gastos por categoria, mês analisado e referência</caption>
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>{current ? shortMonth(current) : "Analisado"}</th>
                    <th>{shortMonth(comparison.mes_referencia)}</th>
                    <th>Diferença</th>
                    <th>Variação</th>
                  </tr>
                </thead>
                <tbody>{comparison.por_categoria.map((item) => <tr key={categoryKey(item)}>
                  <th scope="row">{item.categoria}</th>
                  <td>
                    <a href={transactionLink(current, item.categoria, undefined, item.category_id)}>{currency(item.total)}</a>
                  </td>
                  <td>
                    <a href={transactionLink(comparison.mes_referencia, item.categoria, undefined, item.category_id)}>{currency(item.total_referencia)}</a>
                  </td>
                  <td>{currency(item.diferenca)}</td>
                  <td>{item.percentual == null ? <>Indisponível<small>{comparisonReason(item.motivo)}</small></> : `${item.percentual > 0 ? "+" : ""}${percent(item.percentual, 1)}`}</td>
                </tr>)}</tbody>
              </table>
            </div>
          </details>
          <p className="gc-footnote">Uma redução nos arquivos importados não comprova economia. Os períodos podem ter coberturas diferentes.</p>
        </> : <div className="gc-comparison-empty">
          <Icon name="columns" size={32} />
          <p>{current ? "Selecione outro mês disponível para comparar os gastos e as categorias." : "Escolha um mês específico para comparar."}</p>
        </div>}
      </section>
    </div>

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

    <div className="gc-bottom-grid">
      <Services data={data} />
      <section className="gc-surface gc-recent" aria-labelledby="recent-heading">
        <div className="gc-section-heading">
          <div>
            <h2 id="recent-heading">Últimas movimentações</h2>
            <p>Até cinco lançamentos deste período.</p>
          </div>
          <Icon name="receipt" size={22} />
        </div>
        <ul className="gc-recent-list">{data.recentes.slice(0, 5).map((item) => <li key={item.id}>
          <CategoryMark name={item.categoria} />
          <div>
            <strong>{item.estabelecimento || item.descricao}</strong>
            <span>{dayLabel(item.data)} · {item.categoria}</span>
          </div>
          <b>{currency(item.valor)}</b>
        </li>)}</ul>{!data.recentes.length ? <p className="pd-empty">Nenhum lançamento neste período.</p> : null}<a className="gc-section-link" href={transactionLink(current, undefined, undefined, undefined, "all")}>Ver todas as transações <Icon name="arrow" size={18} />
        </a>
      </section>
    </div>

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
    <p className="gc-data-note">{data.cobertura.inicio && data.cobertura.fim ? `Lançamentos observados de ${formatDate(`${data.cobertura.inicio}T12:00:00`)} a ${formatDate(`${data.cobertura.fim}T12:00:00`)}. ` : ""}A análise representa os arquivos importados, que podem não cobrir todas as movimentações da conta.</p>
  </div>;
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

function Services({ data }: { data: AnalyticsData }) {
  return <section className="gc-surface gc-services" aria-labelledby="services-heading">
    <div className="gc-section-heading">
      <div>
        <h2 id="services-heading">O que se repete</h2>
        <p>Assinaturas identificadas e cobranças recorrentes.</p>
      </div>
      <Icon name="repeat" size={22} />
    </div>{data.servicos.length ? <>
      <div className="gc-services-chart" style={{ height: Math.max(110, data.servicos.length * 39) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.servicos.map((item) => ({ ...item, plot: Number(item.total_periodo) }))} layout="vertical" barSize={12} margin={{ left: 0, top: 0, right: 80, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="estabelecimento" width={95} axisLine={false} tickLine={false} tick={{ fill: "#334c51", fontSize: 12 }} />
            <Tooltip formatter={(value) => currency(Number(value))} cursor={{ fill: "#f4f7f5" }} />
            <Bar dataKey="plot" name="Gasto observado no período" fill="#688b80" radius={4} isAnimationActive={false}>
              <LabelList dataKey="plot" position="right" formatter={(value: unknown) => currency(Number(value))} style={{ fill: "#354e50", fontSize: 12 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="gc-details">
        <summary>Serviços, valores e evidências <Icon name="arrow" size={16} />
        </summary>
        <ul className="gc-service-details">{data.servicos.map((service) => <li key={service.estabelecimento}>
          <a href={transactionLink(data.mes, undefined, service.estabelecimento)}>
            <strong>{service.estabelecimento}</strong>
            <b>{currency(service.total_periodo)}<small>no período</small>
            </b>
          </a>
          <p>{service.classificacoes.includes("recorrencia_confirmada") ? "Recorrência confirmada" : "Assinatura identificada pelo nome"}{service.classificacoes.length > 1 ? " e assinatura identificada" : ""}</p>
          <dl>
            <div>
              <dt>Base mensal ({shortMonth(service.mes_base)})</dt>
              <dd>{currency(service.base_mensal)}</dd>
            </div>
            <div>
              <dt>Extrapolação de 12 meses</dt>
              <dd>{currency(service.anualizado)}</dd>
            </div>
          </dl>
          <p>Última cobrança: {dayLabel(service.ultima_cobranca)}. Evidência: {service.meses_evidencia.map(shortMonth).join(", ")}.{service.lacunas.length ? ` Sem dados em ${service.lacunas.map(shortMonth).join(", ")}.` : ""}</p>
        </li>)}</ul>
      </details>
    </> : <p className="pd-empty">Nenhum serviço identificado. A confirmação de recorrência exige ao menos dois meses de dados.</p>}<p className="gc-footnote">Valores do período selecionado. A detecção consulta o histórico completo; a estimativa anual não prevê cobranças futuras.</p>
  </section>;
}
