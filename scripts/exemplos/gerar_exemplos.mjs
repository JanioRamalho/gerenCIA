/** Gera somente dados fictícios para importar no gerenCIA; nenhum dado pessoal. */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Workbook, SpreadsheetFile } from "@oai/artifact-tool";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const output = path.join(root, "frontend/public/exemplos");
const review = path.join(root, ".impeccable/review/exemplos");
await fs.mkdir(output, { recursive: true });
await fs.mkdir(review, { recursive: true });

const statement = [], invoice = [];
let balance = 100000; // Centavos, saldo observado após cada movimento.
for (let index = 0; index < 3; index++) {
  const month = String(index + 9).padStart(2, "0");
  const d = day => `2026-${month}-${String(day).padStart(2, "0")}`;
  const debit = [
    [1, "Salário fictício", [300000, 320000, 310000][index]],
    [2, "Aluguel fictício", -90000],
    [3, "Ônibus fictício", -4000],
    [5, "Restaurante fictício", -[8000, 10000, 6000][index]],
    [6, "Energia fictícia", -[10000, 12000, 11000][index]],
    [8, "Doação fictícia", -2500],
    [9, "Internet fictícia", -9000],
    ...(index !== 1 ? [[12, "Hotel fictício", -(index === 0 ? 15000 : 20000)]] : []),
  ];
  for (const [day, description, cents] of debit) {
    balance += cents;
    statement.push([d(day), cents / 100, `fic-extrato-${month}-${day}`, description, balance / 100]);
  }
  const credit = [
    [2, "Netflix.Com", 2000], [3, "Spotify", 1500],
    [4, "Supermercado fictício", [14000, 18000, 22000][index]],
    [6, "Uber *Trip fictício", [4500, 3500, 5500][index]],
    [7, "Farmácia fictícia", [6000, 5000, 8000][index]],
    ...(index < 2 ? [[8, "Cinema fictício", [3000, 4500][index]]] : []),
    [9, `Notebook fictício - Parcela ${index + 1}/3`, 12000],
    [10, "Tarifa fictícia", 500],
    [11, "Pagamento recebido", -[50000, 60000, 65000][index]],
    ...(index === 1 ? [[12, "Estorno Farmácia fictícia", -1000]] : []),
    ...(index === 2 ? [[13, "Netflix.Com", 2000], [15, "Curso fictício", 3000]] : []),
  ];
  for (const [day, description, cents] of credit) {
    invoice.push([d(day), description, cents / 100, `fic-fatura-${month}-${day}`]);
  }
}

const cases = [
  { name: "modelo-vazio", headers: ["Data", "Descrição", "Valor", "Categoria", "ID"], rows: [], amountColumns: [2], dateColumn: 0 },
  { name: "exemplo-extrato-3-meses", headers: ["Data", "Valor", "Identificador", "Descrição", "Saldo"], rows: statement, amountColumns: [1, 4], dateColumn: 0 },
  { name: "exemplo-fatura-3-meses", headers: ["date", "title", "amount", "id"], rows: invoice, amountColumns: [2], dateColumn: 0 },
  { name: "exemplo-comparacao-com-lacuna", headers: ["Data", "Descrição", "Valor", "Categoria", "ID"],
    rows: [["2026-08-01", "Restaurante fictício", -100, "Alimentação", "fic-lacuna-a1"],
           ["2026-08-02", "Ônibus fictício", -50, "Transporte", "fic-lacuna-a2"],
           ["2026-10-03", "Restaurante fictício", -80, "Alimentação", "fic-lacuna-o1"],
           ["2026-10-04", "Farmácia fictícia", -30, "Saúde", "fic-lacuna-o2"]], amountColumns: [2], dateColumn: 0 },
];

function csvCell(value) {
  const text = typeof value === "number" ? value.toFixed(2) : String(value ?? "");
  return /[;"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

for (const scenario of cases) {
  const { name, headers, rows, dateColumn, amountColumns } = scenario;
  await fs.writeFile(path.join(output, name + ".csv"), "\uFEFF" + [headers, ...rows].map(row => row.map(csvCell).join(";")).join("\r\n") + "\r\n", "utf8");
  const wb = Workbook.create();
  const sheet = wb.worksheets.add("Movimentos fictícios");
  const matrix = [headers, ...rows.map(row => row.map((value, index) => index === dateColumn ? new Date(`${value}T00:00:00Z`) : value))];
  sheet.getRangeByIndexes(0, 0, matrix.length, headers.length).values = matrix;
  const body = sheet.getRangeByIndexes(0, 0, Math.max(2, matrix.length), headers.length);
  body.format.font = { name: "Arial", size: 11, color: "#16343D" };
  body.format.rowHeight = 23;
  body.format.verticalAlignment = "center";
  sheet.getRangeByIndexes(0, 0, 1, headers.length).format = { fill: "#0B2A33", font: { bold: true, color: "#FFFFFF" }, rowHeight: 28 };
  for (let col = 0; col < headers.length; col++) {
    const range = sheet.getRangeByIndexes(0, col, Math.max(2, matrix.length), 1);
    range.format.columnWidth = /descri|title/i.test(headers[col]) ? 43 : /id|identificador/i.test(headers[col]) ? 29 : 18;
    if (matrix.length > 1) {
      const values = sheet.getRangeByIndexes(1, col, matrix.length - 1, 1);
      if (col === dateColumn) values.setNumberFormat("dd/mm/yyyy");
      if (amountColumns.includes(col)) values.setNumberFormat("0.00");
    }
  }
  sheet.showGridLines = false;
  sheet.freezePanes.freezeRows(1);
  wb.recalculate();
  const inspected = await wb.inspect({ kind: "region", sheetId: sheet.name, range: `A1:${String.fromCharCode(64 + headers.length)}${Math.min(matrix.length, 5)}`, maxChars: 1200, tableMaxRows: 5, tableMaxCols: headers.length });
  await fs.writeFile(path.join(review, name + ".ndjson"), inspected.ndjson ?? "");
  const png = await wb.render({ sheetName: sheet.name, range: `A1:${String.fromCharCode(64 + headers.length)}${Math.min(Math.max(matrix.length, 2), 11)}`, scale: 1.4 });
  await fs.writeFile(path.join(review, name + ".png"), new Uint8Array(await png.arrayBuffer()));
  await (await SpreadsheetFile.exportXlsx(wb)).save(path.join(output, name + ".xlsx"));
  // A inspeção automática da ferramenta é evidência local, não download do produto.
  const autoInspection = path.join(output, name + ".xlsx.inspect.ndjson");
  try { await fs.rename(autoInspection, path.join(review, name + ".xlsx.inspect.ndjson")); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  console.log(`${name}: ${rows.length} lançamentos fictícios`);
}
