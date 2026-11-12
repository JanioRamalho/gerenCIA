import { useEffect, useState } from "react";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import type { User } from "../../auth/api";
import { money, percent, type DashboardData } from "../../panel/api";

type PanelDashboardProps = {
  user: User;
  data: DashboardData;
  month: string | null;      // "2026-08", ou null para todos os meses
  onMonthChange: (month: string | null) => void;
  busy: boolean;
  failed: boolean;
};

const INK = "#0F3440";
const REST = "#5B8A88";
const MUTED = "#B9CDC9";
const FIRST_ENTRIES = 10;

/**
 * Dashboard do painel com os dados reais do usuário.
 *
 * Todos os números vêm da API, calculados com pandas sobre as transações
 * gravadas no banco. Aqui só se escolhe o mês, filtra por categoria e desenha.
 */
export default function PanelDashboard({ user, data, month, onMonthChange, busy, failed }: PanelDashboardProps) {
  const [category, setCategory] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Trocar de mês começa a leitura do zero: sem filtro e com a lista recolhida.
  useEffect(() => {
    setCategory(null);
    setShowAll(false);
  }, [month]);

  const firstName = user.name.split(" ")[0];
  const months = data.por_mes ?? [];
  const summary = data.resumo ?? null;
  const categories = data.por_categoria ?? [];
  const entries = (data.lancamentos ?? []).filter((item) => !category || item.categoria === category);
  const visibleEntries = showAll ? entries : entries.slice(0, FIRST_ENTRIES);
  const topCategory = categories[0];
  const periodLabel = month ? (months.find((item) => item.mes === month)?.rotulo ?? month) : "Todos os meses";
  const variation = data.variacao ?? null;
  const recurring = data.recorrentes ?? [];
  const named = data.assinaturas_pelo_nome ?? [];
  const selectedTotal = categories.find((item) => item.categoria === category)?.total;

  return <div className="panel-page">
    <header className="panel-page-head">
      <h1>Olá, {firstName}.</h1>
      <p className="lead">
        Análise de {data.arquivos} {data.arquivos === 1 ? "arquivo enviado" : "arquivos enviados"}, calculada com pandas a partir das transações gravadas.{" "}
        <a className="text-link" href="/app/files">Enviar ou gerenciar arquivos</a>
      </p>
    </header>

    {failed && <p className="pd-error" role="alert">Não foi possível atualizar. Mostrando os últimos dados carregados.</p>}

    <section className="panel-card" aria-labelledby="period-title" aria-busy={busy}>
      <h2 id="period-title">Período</h2>
      <div className="pd-tabs" role="group" aria-label="Escolher período">
        <button type="button" aria-pressed={month === null} onClick={() => onMonthChange(null)}>Todos os meses</button>
        {months.map((item) => <button key={item.mes} type="button" aria-pressed={month === item.mes} onClick={() => onMonthChange(item.mes)}>{item.rotulo}</button>)}
      </div>

      {summary ? <dl className="pd-metrics">
        <div className="is-main"><dt>Total de saídas</dt><dd><strong>{money(summary.total_saidas)}</strong><small>{periodLabel} · {summary.quantidade_saidas} lançamentos</small></dd></div>
        <div><dt>Variação mensal</dt><dd>
          {variation
            ? <><strong>{variation.percentual > 0 ? "+" : variation.percentual < 0 ? "−" : ""}{percent(Math.abs(variation.percentual), 1)}</strong>
              <small>{money(Math.abs(variation.diferenca))} {variation.diferenca < 0 ? "a menos" : "a mais"} que em {variation.rotulo_anterior}</small></>
            : <><strong>—</strong><small>{month ? "Sem mês anterior para comparar" : "Escolha um mês para comparar"}</small></>}
        </dd></div>
        <div><dt>Média por dia</dt><dd><strong>{money(summary.media_por_dia)}</strong><small>Total dividido por {summary.dias} dias</small></dd></div>
        <div><dt>Maior categoria</dt><dd><strong>{topCategory?.categoria ?? "—"}</strong><small>{topCategory ? `${percent(topCategory.participacao)} do total` : ""}</small></dd></div>
        <div><dt>Mediana por lançamento</dt><dd><strong>{money(summary.mediana)}</strong><small>Média de {money(summary.media)}</small></dd></div>
        <div><dt>Entradas e pagamentos</dt><dd><strong>{money(summary.total_entradas)}</strong><small>Fora do total de saídas</small></dd></div>
      </dl> : <p className="pd-empty">Não há saídas neste período.</p>}
    </section>

    {summary && <div className="pd-grid">
      <section className="panel-card" aria-labelledby="month-title">
        <h2 id="month-title">Saídas por mês</h2>
        <div className="pd-chart" role="img" aria-label={months.map((item) => `${item.rotulo}: ${money(item.total)}`).join(". ")}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={months} margin={{ top: 24, right: 8, bottom: 0, left: 8 }}>
              <XAxis dataKey="rotulo" tickLine={false} axisLine={false} />
              <YAxis hide />
              <Bar dataKey="total" radius={[6, 6, 0, 0]} isAnimationActive={false} onClick={(_, index) => { if (months[index]) onMonthChange(months[index].mes); }}>
                {months.map((item) => <Cell key={item.mes} fill={month === null || month === item.mes ? INK : MUTED} cursor="pointer" />)}
                <LabelList dataKey="total" position="top" formatter={(value: unknown) => money(Number(value))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="pd-hint">Clique em uma coluna para ver só aquele mês.</p>
      </section>

      <section className="panel-card" aria-labelledby="category-title">
        <h2 id="category-title">Para onde foi o dinheiro</h2>
        <div className="pd-chart" style={{ height: Math.max(200, categories.length * 42) }} role="img" aria-label={categories.map((item) => `${item.categoria}: ${money(item.total)}`).join(". ")}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categories} layout="vertical" margin={{ top: 0, right: 96, bottom: 0, left: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="categoria" width={104} tickLine={false} axisLine={false} />
              <Bar dataKey="total" radius={[0, 6, 6, 0]} maxBarSize={24} isAnimationActive={false} onClick={(_, index) => { const row = categories[index]; if (row) setCategory(category === row.categoria ? null : row.categoria); }}>
                {categories.map((item) => <Cell key={item.categoria} fill={category === null || category === item.categoria ? (category === item.categoria ? INK : REST) : MUTED} cursor="pointer" />)}
                <LabelList dataKey="total" position="right" formatter={(value: unknown) => money(Number(value))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="pd-options" role="group" aria-label="Filtrar lançamentos por categoria">
          {categories.map((item) => <button key={item.categoria} type="button" aria-pressed={category === item.categoria} onClick={() => setCategory(category === item.categoria ? null : item.categoria)}>
            <span>{item.categoria}</span><strong>{money(item.total)}</strong><small>{percent(item.participacao)}</small>
          </button>)}
        </div>
      </section>
    </div>}

    {summary && <section className="panel-card" aria-labelledby="entries-title">
      <h2 id="entries-title">Lançamentos</h2>
      <p className="pd-hint">{category ? `${category} em ${periodLabel.toLowerCase()}` : `Todas as categorias em ${periodLabel.toLowerCase()}`}, do mais recente ao mais antigo. {entries.length} {entries.length === 1 ? "lançamento" : "lançamentos"}.</p>
      {entries.length === 0
        ? <p className="pd-empty">Não há lançamentos desta categoria neste período.</p>
        : <>
          <div className="pd-scroll"><table className="pd-table">
            <caption className="sr-only">Lançamentos</caption>
            <thead><tr><th scope="col">Data</th><th scope="col">Estabelecimento</th><th scope="col">Categoria</th><th scope="col">Valor</th></tr></thead>
            <tbody>{visibleEntries.map((item, index) => <tr key={`${item.data}-${item.descricao}-${item.valor}-${index}`}>
              <td>{item.data}</td>
              <td><strong>{item.estabelecimento}</strong>{item.parcela && <small>Parcela {item.parcela}</small>}</td>
              <td>{item.categoria}</td>
              <td>{money(item.valor)}</td>
            </tr>)}</tbody>
            {category && selectedTotal !== undefined && <tfoot><tr><th scope="row" colSpan={3}>Total de {category.toLowerCase()}</th><td>{money(selectedTotal)}</td></tr></tfoot>}
          </table></div>
          {entries.length > FIRST_ENTRIES && <button className="text-button" type="button" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>
            {showAll ? `Mostrar só os ${FIRST_ENTRIES} mais recentes` : `Mostrar os ${entries.length} lançamentos`}
          </button>}
        </>}
    </section>}

    <section className="panel-card" aria-labelledby="recurring-title">
      <h2 id="recurring-title">Assinaturas e pagamentos recorrentes</h2>
      <h3>Recorrentes confirmados</h3>
      <p className="pd-hint">Mesmo estabelecimento e mesmo valor em todos os meses enviados. Parcelas não entram.</p>
      {recurring.length === 0
        ? <p className="pd-empty">{(data.meses_com_gastos ?? 0) < 2 ? "Envie arquivos de pelo menos dois meses para confirmar recorrências." : "Nenhum pagamento recorrente encontrado."}</p>
        : <div className="pd-scroll"><table className="pd-table">
          <thead><tr><th scope="col">Estabelecimento</th><th scope="col">Valor</th><th scope="col">Dia</th><th scope="col">Por mês</th><th scope="col">No ano</th></tr></thead>
          <tbody>{recurring.map((item) => <tr key={`${item.estabelecimento}-${item.valor}`}>
            <td>{item.estabelecimento}</td><td>{money(item.valor)}</td><td>{item.dia_mais_recente}</td><td>{money(item.total_por_mes)}</td><td>{money(item.custo_no_ano)}</td>
          </tr>)}</tbody>
        </table></div>}

      <h3>Assinaturas identificadas pelo nome</h3>
      <p className="pd-hint">Serviços conhecidos, como Netflix e Spotify, mesmo com um único mês de dados.</p>
      {named.length === 0
        ? <p className="pd-empty">Nenhuma assinatura conhecida encontrada.</p>
        : <div className="pd-scroll"><table className="pd-table">
          <thead><tr><th scope="col">Serviço</th><th scope="col">Valor</th><th scope="col">Última cobrança</th><th scope="col">No ano</th></tr></thead>
          <tbody>{named.map((item) => <tr key={item.estabelecimento}>
            <td>{item.estabelecimento}</td><td>{money(item.valor)}</td><td>{item.ultima_cobranca}</td><td>{money(item.custo_no_ano)}</td>
          </tr>)}</tbody>
        </table></div>}
    </section>
  </div>;
}
