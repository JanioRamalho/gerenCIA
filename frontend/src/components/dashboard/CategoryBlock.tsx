import { useEffect, useState } from "react";
import { CategoryBars, CategoryDonut } from "./CategoryChart";
import {
  categoryRows, formatPercentage, money, periodLabel, sortByValue,
  type Category, type CategoryRow, type ChartType, type DemoState, type Period,
} from "./demoModel";

type Sort = "value" | "category";

type Props = {
  state: DemoState;
  onChange: (patch: Partial<DemoState>) => void;
};

// Chave do localStorage onde fica a ordem escolhida para a lista.
const sortStorageKey = "gerencia-demo-sort";

/** A ordem guardada na última visita. Sem acesso ao armazenamento, vale "maior gasto". */
function readSavedSort(): Sort {
  try {
    if (localStorage.getItem(sortStorageKey) === "category") {
      return "category";
    }
    return "value";
  } catch {
    // O navegador pode bloquear o localStorage (por exemplo, numa aba anônima).
    return "value";
  }
}

/** As categorias do período na ordem escolhida: do maior gasto para o menor, ou de A a Z. */
function rowsInOrder(period: Period, sort: Sort): CategoryRow[] {
  const rows = categoryRows(period);
  if (sort === "category") {
    return [...rows].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }
  return sortByValue(rows);
}

/**
 * Bloco (a) da demonstração: o gráfico das categorias e a lista ao lado. A
 * lista traz os mesmos valores do gráfico e permite escolher pelo teclado.
 */
export default function CategoryBlock({ state, onChange }: Props) {
  const { period, category, chart } = state;
  const [sort, setSort] = useState<Sort>(readSavedSort);
  // A categoria sob o mouse ou o foco, destacada antes de qualquer clique.
  const [preview, setPreview] = useState<Category | null>(null);

  const rows = rowsInOrder(period, sort);
  // O destaque do mouse vence a categoria escolhida.
  const focus = preview ?? category;

  // Guarda a ordem escolhida para a próxima visita.
  useEffect(() => {
    try {
      localStorage.setItem(sortStorageKey, sort);
    } catch {
      // Sem armazenamento, a ordem continua funcionando; só não é lembrada.
    }
  }, [sort]);

  // Quando o período, o gráfico ou a ordem mudam, as barras trocam de lugar sem
  // o mouse sair delas. O destaque é apagado para não ficar preso numa
  // categoria que o mouse já não aponta.
  useEffect(() => setPreview(null), [period, chart, sort]);

  // Clicar de novo na categoria escolhida desfaz a escolha.
  function toggleCategory(name: Category) {
    if (category === name) {
      onChange({ category: null });
    } else {
      onChange({ category: name });
    }
  }

  // O gráfico é um desenho só (role="img"); a descrição diz aos leitores de tela
  // que a lista ao lado traz os mesmos valores.
  let chartName = "rosca";
  if (chart === "bar") {
    chartName = "barras";
  }
  const chartDescription = `Gráfico de ${chartName} com a distribuição das saídas. A lista ao lado traz os mesmos valores e permite filtrar pelo teclado.`;

  return <section className="analysis-block category-block" id="demo-categories" aria-labelledby="category-title">
    <div className="block-heading">
      <div><h3 id="category-title"><span>(a)</span> Para onde foi o dinheiro</h3><p>{periodLabel(period)}. Selecione uma categoria para filtrar os lançamentos.</p></div>
      <ChartSwitch chart={chart} onChoose={(next) => onChange({ chart: next })} />
    </div>

    <div className="category-layout">
      <div className="category-chart-area">
        <div className={`category-chart is-${chart}`} role="img" aria-label={chartDescription}>
          {chart === "bar"
            ? <CategoryBars rows={rows} focus={focus} category={category} onPreview={setPreview} onToggle={toggleCategory} />
            : <CategoryDonut period={period} focus={focus} onPreview={setPreview} onToggle={toggleCategory} />}
        </div>
        <ChartDetail category={focus} period={period} />
      </div>

      <div className="category-ledger">
        <div className="ledger-heading">
          <strong>Resumo por categoria</strong>
          <SortSwitch sort={sort} onChoose={setSort} />
        </div>
        <div className="category-options">
          {rows.map((row) => <CategoryOption
            key={row.name}
            row={row}
            selected={category === row.name}
            showColor={chart === "donut"}
            onToggle={toggleCategory}
            onPreview={setPreview}
          />)}
        </div>
        {category && <button className="clear-category text-button" type="button" onClick={() => onChange({ category: null })}>
          Mostrar todas as categorias
        </button>}
      </div>
    </div>
  </section>;
}

type ChartSwitchProps = {
  chart: ChartType;
  onChoose: (chart: ChartType) => void;
};

/** Os dois botões que trocam entre barras e rosca. */
function ChartSwitch({ chart, onChoose }: ChartSwitchProps) {
  return <div className="chart-switch segmented" role="group" aria-label="Tipo de gráfico">
    <button type="button" aria-pressed={chart === "bar"} onClick={() => onChoose("bar")}>Barras</button>
    <button type="button" aria-pressed={chart === "donut"} onClick={() => onChoose("donut")}>Rosca</button>
  </div>;
}

type SortSwitchProps = {
  sort: Sort;
  onChoose: (sort: Sort) => void;
};

/** Os dois botões que ordenam a lista: maior gasto primeiro ou de A a Z. */
function SortSwitch({ sort, onChoose }: SortSwitchProps) {
  return <div className="sort-switch segmented" role="group" aria-label="Ordenar categorias">
    <button type="button" aria-pressed={sort === "value"} onClick={() => onChoose("value")}>Maior gasto</button>
    <button type="button" aria-pressed={sort === "category"} onClick={() => onChoose("category")}>A–Z</button>
  </div>;
}

type CategoryOptionProps = {
  row: CategoryRow;
  selected: boolean;
  showColor: boolean; // a bolinha de cor só aparece com a rosca, que usa as cores
  onToggle: (name: Category) => void;
  onPreview: (name: Category | null) => void;
};

/** Uma categoria da lista. Passar o mouse ou o foco destaca a categoria no gráfico. */
function CategoryOption({ row, selected, showColor, onToggle, onPreview }: CategoryOptionProps) {
  return <button
    type="button"
    aria-pressed={selected}
    onClick={() => onToggle(row.name)}
    onFocus={() => onPreview(row.name)}
    onBlur={() => onPreview(null)}
    onMouseEnter={() => onPreview(row.name)}
    onMouseLeave={() => onPreview(null)}
  >
    <span>{showColor && <i style={{ backgroundColor: row.color }} />}{row.name}</span>
    <strong>{money(row.value)}</strong>
    <small>{formatPercentage(row.share)}</small>
  </button>;
}

/** A frase abaixo do gráfico: o valor e a parte da categoria em destaque, ou uma dica. */
function ChartDetail({ category, period }: { category: Category | null; period: Period }) {
  const item = categoryRows(period).find((row) => row.name === category);

  if (!item) {
    return <p className="chart-detail" role="status">Selecione uma categoria no gráfico ou na lista para ver o valor e os lançamentos dela.</p>;
  }

  const periodName = periodLabel(period).toLowerCase();
  return <p className="chart-detail" role="status">
    <span className="category-dot" style={{ backgroundColor: item.color }} /> <strong>{item.name}</strong> soma <strong>{money(item.value)}</strong>,
    {" "}ou <strong>{formatPercentage(item.share)}</strong> das saídas de {periodName}.
  </p>;
}
