import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import Brand from "../components/Brand";

/** Resposta da API em POST /api/analise/previa (ver backend/app/pipeline/previa.py). */
type Resultado = {
  arquivo: { nome: string; formato: string };
  qualidade: { linhas_lidas: number; linhas_validas: number; linhas_rejeitadas: number; percentual: number };
  avisos: string[];
  rejeitadas: { linha: number; codigo: string; mensagem: string; conteudo: { data: string; descricao: string; valor: string } }[];
  resumo: {
    total_saidas: number; total_entradas: number; quantidade_saidas: number;
    media: number; mediana: number; maior: number; periodo_inicio: string; periodo_fim: string;
  } | null;
  por_mes: { mes: string; rotulo: string; total: number }[];
  por_categoria: { categoria: string; total: number; quantidade: number; participacao: number }[];
  maiores_lancamentos: { data: string; estabelecimento: string; categoria: string; valor: number; parcela: boolean }[];
  recorrentes: { estabelecimento: string; valor: number; dia_mais_recente: number; total_por_mes: number; custo_no_ano: number; meses: number }[];
  assinaturas_pelo_nome: { estabelecimento: string; valor: number; ultima_cobranca: string; custo_no_ano: number }[];
};

const FORMATOS: Record<string, string> = {
  fatura_nubank: "Fatura Nubank",
  extrato_nubank: "Extrato Nubank",
  planilha_modelo: "Planilha-modelo / outro banco",
};

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const money = (value: number) => brl.format(value);
const percent = (value: number) => new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 }).format(value);

/**
 * Página de teste da análise (/teste-analise).
 *
 * Envia um CSV ou XLSX para a API, que lê o arquivo com pandas, e mostra o
 * resultado como o dashboard mostrará. Nada é salvo e não é preciso entrar na conta.
 */
export default function AnalysisTestPage() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const erroRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    document.title = "Teste da análise | gerenCIA";
  }, []);

  useEffect(() => {
    if (erro) erroRef.current?.focus();
  }, [erro]);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!arquivo || carregando) return;
    setCarregando(true);
    setErro(null);
    setResultado(null);
    try {
      const resposta = await fetch(`/api/analise/previa?nome=${encodeURIComponent(arquivo.name)}`, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream", Accept: "application/json" },
        body: arquivo,
      });
      let corpo: unknown = null;
      try {
        corpo = await resposta.json();
      } catch {
        // Resposta sem JSON (por exemplo, a API fora do ar atrás do proxy do Vite).
      }
      if (!resposta.ok) {
        const detalhe = (corpo as { detail?: unknown } | null)?.detail;
        throw new Error(typeof detalhe === "string" ? detalhe : "A API não respondeu. Confira se o backend está rodando.");
      }
      setResultado(corpo as Resultado);
    } catch (falha) {
      setErro(falha instanceof Error && falha.message ? falha.message : "Não foi possível enviar o arquivo.");
    } finally {
      setCarregando(false);
    }
  }

  return <div className="at-page">
    <header className="at-header">
      <Brand />
      <span className="at-badge">Ambiente de teste · nada é salvo</span>
    </header>

    <main className="at-main">
      <section className="at-card">
        <h1>Teste da análise de fatura</h1>
        <p className="at-lead">Escolha uma fatura ou extrato em CSV ou XLSX (até 5 MB). O arquivo é lido com pandas no backend e o resultado aparece abaixo, sem login e sem gravar no banco.</p>
        <form className="at-form" onSubmit={enviar}>
          <label className="at-file">
            <span>Arquivo da fatura</span>
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={(evento) => { setArquivo(evento.target.files?.[0] ?? null); setErro(null); }}
            />
          </label>
          <button className="at-button" type="submit" disabled={!arquivo || carregando}>
            {carregando ? "Analisando…" : "Analisar fatura"}
          </button>
        </form>
        <div role="status" aria-live="polite" className="at-status">{carregando ? "Analisando o arquivo…" : ""}</div>
        {erro && <p className="at-error" role="alert" tabIndex={-1} ref={erroRef}>{erro}</p>}
      </section>

      {resultado && <Dashboard resultado={resultado} />}
    </main>
  </div>;
}

function Dashboard({ resultado }: { resultado: Resultado }) {
  const { resumo, qualidade } = resultado;
  const formato = FORMATOS[resultado.arquivo.formato] ?? resultado.arquivo.formato;

  return <>
    <section className="at-card" aria-labelledby="at-quality-title">
      <h2 id="at-quality-title">Leitura do arquivo</h2>
      <p className="at-lead"><strong>{resultado.arquivo.nome}</strong> · formato reconhecido: {formato}</p>
      <dl className="at-stats">
        <div><dt>Linhas lidas</dt><dd>{qualidade.linhas_lidas}</dd></div>
        <div><dt>Válidas</dt><dd>{qualidade.linhas_validas}</dd></div>
        <div><dt>Rejeitadas</dt><dd>{qualidade.linhas_rejeitadas}</dd></div>
        <div><dt>Qualidade</dt><dd>{qualidade.percentual.toLocaleString("pt-BR")}%</dd></div>
      </dl>
      {resultado.avisos.length > 0 && <ul className="at-notes">{resultado.avisos.map((aviso) => <li key={aviso}>{aviso}</li>)}</ul>}
      {resultado.rejeitadas.length > 0 && <details className="at-details">
        <summary>Ver {resultado.rejeitadas.length} linha(s) rejeitada(s)</summary>
        <div className="at-scroll"><table>
          <thead><tr><th>Linha</th><th>Motivo</th><th>Conteúdo</th></tr></thead>
          <tbody>{resultado.rejeitadas.map((linha) => <tr key={linha.linha}>
            <td>{linha.linha}</td>
            <td>{linha.mensagem}</td>
            <td>{[linha.conteudo.data, linha.conteudo.descricao, linha.conteudo.valor].filter(Boolean).join(" · ")}</td>
          </tr>)}</tbody>
        </table></div>
      </details>}
    </section>

    {resumo && <>
      <section className="at-card" aria-labelledby="at-summary-title">
        <h2 id="at-summary-title">Resumo dos gastos</h2>
        <p className="at-lead">De {resumo.periodo_inicio} a {resumo.periodo_fim}.</p>
        <dl className="at-stats is-big">
          <div><dt>Total de saídas</dt><dd>{money(resumo.total_saidas)}</dd></div>
          <div><dt>Lançamentos</dt><dd>{resumo.quantidade_saidas}</dd></div>
          <div><dt>Média por lançamento</dt><dd>{money(resumo.media)}</dd></div>
          <div><dt>Mediana</dt><dd>{money(resumo.mediana)}</dd></div>
          <div><dt>Maior gasto</dt><dd>{money(resumo.maior)}</dd></div>
          <div><dt>Entradas e pagamentos</dt><dd>{money(resumo.total_entradas)}</dd></div>
        </dl>
      </section>

      <div className="at-grid">
        <section className="at-card" aria-labelledby="at-month-title">
          <h2 id="at-month-title">Saídas por mês</h2>
          <div className="at-chart" role="img" aria-label={resultado.por_mes.map((mes) => `${mes.rotulo}: ${money(mes.total)}`).join(". ")}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resultado.por_mes} margin={{ top: 24, right: 8, bottom: 0, left: 8 }}>
                <XAxis dataKey="rotulo" tickLine={false} axisLine={false} />
                <YAxis hide />
                <Bar dataKey="total" fill="#5B8A88" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                  <LabelList dataKey="total" position="top" formatter={(valor: unknown) => money(Number(valor))} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="at-card" aria-labelledby="at-category-title">
          <h2 id="at-category-title">Gastos por categoria</h2>
          <div className="at-chart" style={{ height: Math.max(180, resultado.por_categoria.length * 44) }} role="img"
            aria-label={resultado.por_categoria.map((item) => `${item.categoria}: ${money(item.total)}`).join(". ")}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resultado.por_categoria} layout="vertical" margin={{ top: 0, right: 90, bottom: 0, left: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="categoria" width={100} tickLine={false} axisLine={false} />
                <Bar dataKey="total" radius={[0, 6, 6, 0]} isAnimationActive={false}>
                  {resultado.por_categoria.map((item, indice) => <Cell key={item.categoria} fill={indice === 0 ? "#0F3440" : "#5B8A88"} />)}
                  <LabelList dataKey="total" position="right" formatter={(valor: unknown) => money(Number(valor))} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="at-shares">
            {resultado.por_categoria.map((item) => <li key={item.categoria}>
              <span>{item.categoria}</span><span>{percent(item.participacao)} · {item.quantidade} lançamento(s)</span>
            </li>)}
          </ul>
        </section>
      </div>

      <section className="at-card" aria-labelledby="at-recurring-title">
        <h2 id="at-recurring-title">Assinaturas e pagamentos recorrentes</h2>
        <h3>Recorrentes confirmados</h3>
        <p className="at-hint">Mesmo estabelecimento e mesmo valor em todos os meses do arquivo. Parcelas não entram.</p>
        {resultado.recorrentes.length === 0
          ? <p className="at-empty">Nenhum encontrado. Isso é esperado se o arquivo tem só um mês.</p>
          : <div className="at-scroll"><table>
            <thead><tr><th>Estabelecimento</th><th>Valor</th><th>Dia</th><th>Por mês</th><th>No ano</th></tr></thead>
            <tbody>{resultado.recorrentes.map((item) => <tr key={`${item.estabelecimento}-${item.valor}`}>
              <td>{item.estabelecimento}</td><td>{money(item.valor)}</td><td>{item.dia_mais_recente}</td>
              <td>{money(item.total_por_mes)}</td><td>{money(item.custo_no_ano)}</td>
            </tr>)}</tbody>
          </table></div>}

        <h3>Assinaturas identificadas pelo nome</h3>
        <p className="at-hint">Serviços conhecidos, como Netflix e Spotify, mesmo quando o arquivo tem um único mês.</p>
        {resultado.assinaturas_pelo_nome.length === 0
          ? <p className="at-empty">Nenhuma assinatura conhecida encontrada.</p>
          : <div className="at-scroll"><table>
            <thead><tr><th>Serviço</th><th>Valor</th><th>Última cobrança</th><th>Custo no ano</th></tr></thead>
            <tbody>{resultado.assinaturas_pelo_nome.map((item) => <tr key={item.estabelecimento}>
              <td>{item.estabelecimento}</td><td>{money(item.valor)}</td><td>{item.ultima_cobranca}</td><td>{money(item.custo_no_ano)}</td>
            </tr>)}</tbody>
          </table></div>}
      </section>

      <section className="at-card" aria-labelledby="at-top-title">
        <h2 id="at-top-title">Maiores lançamentos</h2>
        <div className="at-scroll"><table>
          <thead><tr><th>Data</th><th>Estabelecimento</th><th>Categoria</th><th>Valor</th></tr></thead>
          <tbody>{resultado.maiores_lancamentos.map((item, indice) => <tr key={`${item.data}-${item.estabelecimento}-${indice}`}>
            <td>{item.data}</td>
            <td>{item.estabelecimento}{item.parcela ? " (parcela)" : ""}</td>
            <td>{item.categoria}</td>
            <td>{money(item.valor)}</td>
          </tr>)}</tbody>
        </table></div>
      </section>
    </>}
  </>;
}
