import { useEffect, useState } from "react";
import type { User } from "../../auth/api";
import { leaveIfSignedOut, listBudgets, money, percent, transactionLink, type BudgetData, type DashboardData } from "../../panel/api";
import { categoryColor } from "../../panel/categoryColor";
import Icon from "../Icon";
import BudgetUsage, { BudgetStatus } from "./BudgetUsage";
import MonthlySpendingChart from "./MonthlySpendingChart";
import SpendingProfileCard from "./SpendingProfileCard";
import { formatMonth, isPanelMonth } from "./formatDate";

type PanelDashboardProps = {
  user: User;
  data: DashboardData;
  month: string | null;      // "2026-08", ou null para todos os meses
  onMonthChange: (month: string | null) => void;
  busy: boolean;
  failed: boolean;
  onRetry: () => void;
};

const FIRST_ENTRIES = 5;

/**
 * Dashboard do painel com os dados reais do usuário.
 *
 * Todos os números vêm da API, calculados com pandas sobre as transações
 * gravadas no banco. Aqui só se escolhe o mês, filtra por categoria e desenha.
 */
export default function PanelDashboard({ user, data, month, onMonthChange, busy, failed, onRetry }: PanelDashboardProps) {
  const [category, setCategory] = useState<string | null>(null);
  const firstName = user.name.trim().split(/\s+/)[0];
  const months = data.por_mes ?? [];
  const summary = data.resumo ?? null;
  const categories = data.por_categoria ?? [];
  const visibleEntries = (data.lancamentos ?? []).filter((item) => !category || item.categoria === category).slice(0, FIRST_ENTRIES);
  const topCategory = categories[0];
  const loadedMonth = data.mes ?? null;
  const periodLabel = loadedMonth ? formatMonth(loadedMonth) : "Todos os meses";
  const variation = data.variacao ?? null;
  const recurring = data.recorrentes ?? [];
  const named = data.assinaturas_pelo_nome ?? [];
  const transactionHref = transactionLink({ mes: loadedMonth ?? undefined, categoria: category ?? undefined });
  function chooseMonth(value: string | null) {
    setCategory(null);
    onMonthChange(value);
  }

  return <div className="panel-page">
    <header className="panel-page-head panel-heading-row">
      <div>
        <h1>Olá, {firstName}.</h1>
        <p className="lead">Visão dos seus gastos com base em {data.arquivos} {data.arquivos === 1 ? "arquivo importado" : "arquivos importados"}.</p>
      </div>
      <a className="primary-button is-night" href="/app/files"><Icon name="upload" size={18} /> Importar arquivo</a>
    </header>

    {failed && <p className="pd-error" role="alert">Não foi possível atualizar. Mostrando os últimos dados carregados. <button className="text-button" type="button" onClick={onRetry}>Tentar de novo</button></p>}

    <section className="panel-stack" aria-labelledby="period-title" aria-busy={busy}>
      <div className="panel-heading-row">
        <h2 className="panel-section-title" id="period-title">Visão geral</h2>
        <label className="panel-period-filter"><span>Período</span>
          <select value={month ?? ""} onChange={(event) => chooseMonth(event.target.value || null)}>
            <option value="">Todos os meses</option>
            {months.map((item) => <option key={item.mes} value={item.mes}>{formatMonth(item.mes)}</option>)}
          </select>
        </label>
      </div>
      <p className="sr-only" role="status">{busy ? "Atualizando período…" : ""}</p>

      {summary ? <div className="dashboard-summary">
        <div className="dashboard-total on-night">
          <p className="panel-period"><Icon name="calendar" size={17} /> {periodLabel}</p>
          <p className="dashboard-label">Total de saídas</p>
          <strong>{money(summary.total_saidas)}</strong>
          <p>{summary.quantidade_saidas} {summary.quantidade_saidas === 1 ? "lançamento" : "lançamentos"}</p>
        </div>
        <dl className="pd-metrics">
        <div><dt>Variação entre meses</dt><dd>
          {variation
            ? <><strong>{variation.percentual > 0 ? "+" : variation.percentual < 0 ? "−" : ""}{percent(Math.abs(variation.percentual), 1)}</strong>
              <small>{variation.diferenca === 0 ? `Mesmo total de ${variation.rotulo_anterior}` : `${money(Math.abs(variation.diferenca))} ${variation.diferenca < 0 ? "a menos" : "a mais"} que em ${variation.rotulo_anterior}`}</small></>
            : <><strong>—</strong><small>{loadedMonth ? "Sem mês anterior para comparar" : "Escolha um mês para comparar"}</small></>}
        </dd></div>
        <div><dt>Média por dia</dt><dd><strong>{money(summary.media_por_dia)}</strong><small>Total dividido por {summary.dias} dias</small></dd></div>
        <div><dt>Maior categoria</dt><dd><strong>{topCategory?.categoria ?? "—"}</strong><small>{topCategory ? `${percent(topCategory.participacao)} do total` : ""}</small></dd></div>
        <div><dt>Mediana por lançamento</dt><dd><strong>{money(summary.mediana)}</strong><small>Média de {money(summary.media)}</small></dd></div>
        <div><dt>Outras movimentações</dt><dd><strong>{money(summary.total_entradas)}</strong><small>Entradas, estornos e pagamentos</small></dd></div>
        <div><dt>Maior lançamento</dt><dd><strong>{money(summary.maior)}</strong></dd></div>
        </dl>
      </div> : <p className="panel-card">Não há saídas neste período. <a className="text-link" href={transactionHref}>Ver transações</a></p>}
    </section>

    <SpendingProfileCard user={user} filesCount={data.arquivos} selectedMonth={loadedMonth} onSelectMonth={chooseMonth} />

    {summary && <div className="pd-grid">
      <MonthlySpendingChart months={months} selected={loadedMonth} onSelect={chooseMonth} />

      <section className="panel-card panel-stack" aria-labelledby="category-title">
        <h2 id="category-title">Para onde foi o dinheiro</h2>
        <div className="pd-options" role="group" aria-label="Filtrar lançamentos por categoria">
          {categories.map((item) => <button key={item.categoria} type="button" aria-pressed={category === item.categoria} onClick={() => setCategory(category === item.categoria ? null : item.categoria)}>
            <span className="category-name"><i className="category-dot" aria-hidden="true" style={{ backgroundColor: categoryColor(item.categoria, item.cor) }} />{item.categoria}</span>
            <strong>{money(item.total)}</strong><small>{percent(item.participacao)}</small>
            <span className="category-track" aria-hidden="true"><i style={{ width: `${Math.max(0, Math.min(1, item.participacao)) * 100}%`, backgroundColor: categoryColor(item.categoria, item.cor) }} /></span>
          </button>)}
        </div>
      </section>
    </div>}

    {summary && <section className="panel-card panel-stack" aria-labelledby="entries-title">
      <div className="panel-heading-row">
        <div><h2 id="entries-title">Saídas recentes</h2><p className="pd-hint">{category || "Todas as categorias"} · {periodLabel}</p></div>
        <a className="text-link" href={transactionHref}>Ver todas as transações <Icon name="arrow" size={17} /></a>
      </div>
      {visibleEntries.length === 0
        ? <p className="pd-empty">Não há lançamentos desta categoria neste período.</p>
        : <>
          <div className="pd-scroll" tabIndex={0} role="region" aria-label="Tabela de saídas recentes"><table className="pd-table">
            <caption className="sr-only">Lançamentos</caption>
            <thead><tr><th scope="col">Data</th><th scope="col">Estabelecimento</th><th scope="col">Categoria</th><th scope="col">Valor</th></tr></thead>
            <tbody>{visibleEntries.map((item, index) => <tr key={`${item.data}-${item.descricao}-${item.valor}-${index}`}>
              <td>{item.data}</td>
              <td><strong>{item.estabelecimento}</strong>{item.parcela && <small>Parcela {item.parcela}</small>}</td>
              <td>{item.categoria}</td>
              <td>{money(item.valor)}</td>
            </tr>)}</tbody>
          </table></div>
        </>}
    </section>}

    <BudgetPreview key={loadedMonth} month={loadedMonth ?? ""} />

    <section className="panel-card dashboard-recurring" aria-labelledby="recurring-title">
      <h2 id="recurring-title">Assinaturas e pagamentos recorrentes</h2>
      <h3>Recorrentes confirmados</h3>
      <p className="pd-hint">Mesmo estabelecimento e mesmo valor em todos os meses enviados. Parcelas não entram.</p>
      {recurring.length === 0
        ? <p className="pd-empty">{(data.meses_com_gastos ?? 0) < 2 ? "Envie arquivos de pelo menos dois meses para confirmar recorrências." : "Nenhum pagamento recorrente encontrado."}</p>
        : <div className="pd-scroll" tabIndex={0} role="region" aria-label="Tabela de pagamentos recorrentes"><table className="pd-table">
          <thead><tr><th scope="col">Estabelecimento</th><th scope="col">Valor</th><th scope="col">Dia</th><th scope="col">Por mês</th><th scope="col">No ano</th></tr></thead>
          <tbody>{recurring.map((item) => <tr key={`${item.estabelecimento}-${item.valor}`}>
            <td>{item.estabelecimento}</td><td>{money(item.valor)}</td><td>{item.dia_mais_recente}</td><td>{money(item.total_por_mes)}</td><td>{money(item.custo_no_ano)}</td>
          </tr>)}</tbody>
        </table></div>}

      <h3>Assinaturas identificadas pelo nome</h3>
      <p className="pd-hint">Serviços conhecidos, como Netflix e Spotify, mesmo com um único mês de dados.</p>
      {named.length === 0
        ? <p className="pd-empty">Nenhuma assinatura conhecida encontrada.</p>
        : <div className="pd-scroll" tabIndex={0} role="region" aria-label="Tabela de assinaturas identificadas"><table className="pd-table">
          <thead><tr><th scope="col">Serviço</th><th scope="col">Valor</th><th scope="col">Última cobrança</th><th scope="col">No ano</th></tr></thead>
          <tbody>{named.map((item) => <tr key={item.estabelecimento}>
            <td>{item.estabelecimento}</td><td>{money(item.valor)}</td><td>{item.ultima_cobranca}</td><td>{money(item.custo_no_ano)}</td>
          </tr>)}</tbody>
        </table></div>}
    </section>
  </div>;
}

function BudgetPreview({ month: initialMonth }: { month: string }) {
  const [month, setMonth] = useState(initialMonth);
  const [data, setData] = useState<BudgetData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setFailed(false);
    listBudgets(month, controller.signal).then((result) => {
      if (!controller.signal.aborted) setData(result);
    }).catch((failure: unknown) => {
      if (!controller.signal.aborted && !leaveIfSignedOut(failure)) setFailed(true);
    });
    return () => controller.abort();
  }, [month]);
  const chosenMonth = month || data?.current_month || "";
  const tracked = data?.month === chosenMonth
    ? data.categories.filter((item) => item.used !== null).sort((a, b) => (b.used ?? 0) - (a.used ?? 0))
    : null;
  const href = chosenMonth ? `/app/budgets?mes=${chosenMonth}` : "/app/budgets";
  return <section className="panel-card panel-stack" aria-labelledby="dashboard-budget-title">
    <div className="panel-heading-row">
      <h2 id="dashboard-budget-title">Limites do mês</h2>
      <label className="panel-field panel-month">Mês dos limites
        <input type="month" min="1000-01" max="9999-12" value={chosenMonth} onChange={(event) => {
          if (isPanelMonth(event.target.value)) setMonth(event.target.value);
        }} />
      </label>
    </div>
    {failed ? <p className="pd-error" role="alert">Não foi possível carregar os limites deste mês.</p>
      : tracked === null ? <p className="pd-hint" role="status">Carregando limites…</p>
      : tracked.length > 0 ? <ul className="dashboard-budget-preview">
        {tracked.slice(0, 3).map((item) => <li className={`is-${item.status}`} key={item.id}>
          <div className="panel-heading-row"><strong className="category-name"><i aria-hidden="true" className="category-dot" style={{ backgroundColor: categoryColor(item.name, item.color) }} />{item.name}</strong><BudgetStatus status={item.status} /></div>
          <BudgetUsage item={item} />
        </li>)}
      </ul> : <p className="pd-hint">Nenhum limite definido para este mês.</p>}
    <div><a className="secondary-button" href={href}>{tracked?.length === 0 ? "Definir limites" : "Gerenciar limites"} <Icon name="arrow" size={17} /></a></div>
  </section>;
}
