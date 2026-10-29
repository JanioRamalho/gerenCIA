import { useState } from "react";
import {
  categoryColor, money, periodLabel, sumOf, transactionsFor,
  type Category, type DemoState, type Period, type Transaction,
} from "./demoModel";

// Quantos lançamentos a tabela mostra antes do botão "Mostrar todos".
const firstEntries = 10;

type Props = {
  period: Period;
  category: Category | null; // null mostra todas as categorias
  onChange: (patch: Partial<DemoState>) => void;
};

/**
 * Bloco (b) da demonstração: os lançamentos do período, do mais recente ao
 * mais antigo, filtrados pela categoria escolhida. A soma no rodapé aparece
 * quando a tabela mostra todos os lançamentos e confere com o total.
 */
export default function TransactionsBlock({ period, category, onChange }: Props) {
  const [showAll, setShowAll] = useState(false);

  const entries = transactionsFor(period).filter((item) => !category || item.category === category);
  const periodName = periodLabel(period).toLowerCase();

  let description = `Todas as categorias em ${periodName}, do mais recente ao mais antigo.`;
  if (category) {
    description = `${category} em ${periodName}, do mais recente ao mais antigo.`;
  }

  let countLabel = "lançamentos";
  if (entries.length === 1) {
    countLabel = "lançamento";
  }

  return <section className="analysis-block transactions-block" id="demo-transactions" aria-labelledby="transactions-title">
    <div className="block-heading">
      <div><h3 id="transactions-title"><span>(b)</span> Lançamentos</h3><p>{description}</p></div>
      <span className="block-count">{entries.length} {countLabel}</span>
    </div>

    {entries.length === 0
      ? <div className="transactions-empty">
        <p>Não há lançamentos desta categoria neste período.</p>
        <button className="text-button" type="button" onClick={() => onChange({ category: null })}>Ver todas as categorias</button>
      </div>
      : <>
        <TransactionsTable entries={entries} category={category} periodName={periodName} showAll={showAll} />
        {entries.length > firstEntries && <button className="text-button show-entries" type="button" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>
          {showAll ? `Mostrar só os ${firstEntries} mais recentes` : `Mostrar todos os ${entries.length} lançamentos e a soma`}
        </button>}
      </>}
  </section>;
}

type TransactionsTableProps = {
  entries: Transaction[];
  category: Category | null;
  periodName: string; // por exemplo "agosto de 2026"
  showAll: boolean;
};

/** A tabela dos lançamentos. A soma só aparece quando todos estão à vista, para fechar com o total. */
function TransactionsTable({ entries, category, periodName, showAll }: TransactionsTableProps) {
  let visibleEntries = entries.slice(0, firstEntries);
  if (showAll) {
    visibleEntries = entries;
  }
  const showsEveryEntry = showAll || entries.length <= firstEntries;

  let caption = `Lançamentos em ${periodName}`;
  let sumLabel = " = total de saídas";
  if (category) {
    caption = `Lançamentos de ${category.toLowerCase()} em ${periodName}`;
    sumLabel = ` = total de ${category.toLowerCase()}`;
  }

  return <table className="transaction-table">
    <caption className="sr-only">{caption}</caption>
    <thead><tr><th scope="col">Data</th><th scope="col">Estabelecimento</th><th scope="col">Categoria</th><th scope="col">Valor</th></tr></thead>
    <tbody>
      {visibleEntries.map((item, index) => <tr key={`${item.name}-${item.date}-${item.amount}-${index}`}>
        <td>{item.date}</td>
        <td><strong>{item.name}</strong><small>{item.detail}</small></td>
        <td><span className="category-key"><i style={{ backgroundColor: categoryColor(item.category) }} aria-hidden="true" />{item.category}</span></td>
        <td>{money(item.amount)}</td>
      </tr>)}
    </tbody>
    {showsEveryEntry && <tfoot>
      <tr><th scope="row" colSpan={3}>Soma dos {entries.length} lançamentos{sumLabel}</th><td>{money(sumOf(entries))}</td></tr>
    </tfoot>}
  </table>;
}
