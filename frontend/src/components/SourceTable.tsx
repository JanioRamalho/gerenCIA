import { categoryColor, demo, money } from "./dashboard/demoModel";

const monthNumber: Record<string, string> = { jun: "06", jul: "07", ago: "08" };
const picks = ["Mercado da Vila", "Uber", "Netflix", "Café e Livros"];
const rows = picks.map((name) => demo.ago.transactions.find((item) => item.name === name)!);

const csvLine = (date: string, raw: string, amount: number) => {
  const [day, month] = date.split(" ");
  return `${day}/${monthNumber[month]}/2026;${raw};${amount.toFixed(2).replace(".", ",")}`;
};

export default function SourceTable() {
  return <figure className="source-table" id="tabela-1" aria-labelledby="source-table-caption">
    <figcaption id="source-table-caption" className="figure-caption"><b>Tabela 1</b> A mesma compra no arquivo e na leitura organizada</figcaption>
    <table>
      <thead><tr><th scope="col">Linha no arquivo CSV</th><th scope="col">Estabelecimento</th><th scope="col">Categoria</th><th scope="col">Valor</th></tr></thead>
      <tbody>{rows.map((row) => <tr key={row.raw}>
        <td><code>{csvLine(row.date, row.raw, row.amount)}</code></td>
        <td>{row.name}</td>
        <td><span className="category-key"><i style={{ backgroundColor: categoryColor(row.category) }} aria-hidden="true" />{row.category}</span></td>
        <td>{money(row.amount)}</td>
      </tr>)}</tbody>
    </table>
    <p className="figure-source">Fonte: lançamentos fictícios. A leitura automática dos arquivos está em desenvolvimento.</p>
  </figure>;
}
