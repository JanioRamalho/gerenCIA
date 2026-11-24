import { useEffect, useState } from "react";
import type { User } from "../../auth/api";
import { getSpendingProfile, leaveIfSignedOut, money, percent, type SpendingProfile } from "../../panel/api";
import Icon from "../Icon";
import { formatMonth } from "./formatDate";

type SpendingProfileCardProps = {
  user: User;
  filesCount: number;
  selectedMonth: string | null;
  onSelectMonth: (month: string) => void;
};

const CONFIDENCE_LABEL: Record<"baixa" | "moderada" | "razoavel", string> = {
  baixa: "baixa",
  moderada: "moderada",
  razoavel: "razoável",
};

const decimalFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 });

/**
 * Cartão da IA no painel: perfil de gastos aprendido com regressão linear
 * (mínimos quadrados) e alertas de meses em que o gasto extrapolou o padrão.
 */
export default function SpendingProfileCard({ user, filesCount, selectedMonth, onSelectMonth }: SpendingProfileCardProps) {
  const [data, setData] = useState<SpendingProfile | null>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setFailed(false);
    getSpendingProfile(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted && !leaveIfSignedOut(error)) setFailed(true);
      });
    return () => controller.abort();
  }, [filesCount, user.monthly_income, retry]);

  if (failed && data === null) {
    return <section className="panel-card panel-stack" aria-labelledby="ai-profile-title">
      <div className="panel-heading-row">
        <h2 id="ai-profile-title">Perfil de gastos (IA)</h2>
      </div>
      <p className="pd-error" role="alert">
        Não foi possível calcular o perfil de gastos.{" "}
        <button className="text-button" type="button" onClick={() => setRetry((value) => value + 1)}>Tentar de novo</button>
      </p>
    </section>;
  }

  if (data === null) {
    return <section className="panel-card panel-stack" aria-labelledby="ai-profile-title">
      <h2 id="ai-profile-title">Perfil de gastos (IA)</h2>
      <p className="pd-hint" role="status">Analisando seu histórico com regressão linear…</p>
    </section>;
  }

  if (!data.tem_dados) return null;

  const analyzed = data.meses_analisados ?? 0;
  const minimum = data.minimo_de_meses ?? 4;
  const recommended = data.meses_recomendados ?? 12;
  const confidence = data.confiabilidade ? CONFIDENCE_LABEL[data.confiabilidade] : "baixa";
  const warnings = data.avisos ?? [];

  if (!data.suficiente || !data.perfil) {
    return <section className="panel-card panel-stack" aria-labelledby="ai-profile-title">
      <div className="panel-heading-row">
        <div>
          <h2 id="ai-profile-title">Perfil de gastos (IA)</h2>
          <p className="pd-hint">Modelo próprio de regressão linear para identificar meses fora do seu padrão.</p>
        </div>
        <span className="budget-status is-near">Aguardando histórico</span>
      </div>
      <p className="pd-empty">
        O modelo precisa de pelo menos <strong>{minimum} meses</strong> com gastos para aprender o seu perfil e detectar anomalias
        (atualmente há {analyzed} {analyzed === 1 ? "mês" : "meses"}). Importe mais faturas em{" "}
        <a className="xref" href="/app/files">Arquivos</a>
        {user.monthly_income === null && <> e, se quiser comparar com sua renda, informe-a em <a className="xref" href="/app/account">Conta</a></>}.
      </p>
    </section>;
  }

  const profile = data.perfil;
  const anomalies = data.anomalias ?? [];
  const evaluatedMonths = data.meses ?? [];
  const hasAnomaly = anomalies.length > 0;
  const trendSign = profile.tendencia_mensal > 0 ? "+" : profile.tendencia_mensal < 0 ? "−" : "";
  const thresholdLabel = decimalFormat.format(data.limiar_desvios ?? 2);

  return <section className={`panel-card panel-stack ai-profile${hasAnomaly ? " has-anomaly" : ""}`} aria-labelledby="ai-profile-title">
    <div className="panel-heading-row">
      <div>
        <h2 id="ai-profile-title">Perfil de gastos (IA)</h2>
        <p className="pd-hint">
          Regressão linear treinada sobre {analyzed} meses · confiabilidade {confidence} (ideal: {recommended} meses ou mais).
        </p>
      </div>
      <span className={`budget-status${hasAnomaly ? " is-over" : ""}`}>
        {hasAnomaly
          ? `${anomalies.length} ${anomalies.length === 1 ? "anomalia detectada" : "anomalias detectadas"}`
          : "Dentro do padrão"}
      </span>
    </div>

    {hasAnomaly ? <ul className="ai-anomaly-list" aria-label="Alertas de anomalia nos gastos">
      {anomalies.map((item) => <li className="ai-anomaly-item" key={item.mes}>
        <div className="ai-anomaly-copy">
          <strong>Anomalia em {formatMonth(item.mes)}</strong>
          <p>{item.mensagem}</p>
          {item.percentual_da_renda !== null && data.renda_mensal && <small>
            Corresponde a {percent(item.percentual_da_renda)} da renda mensal informada ({money(data.renda_mensal)}).
          </small>}
        </div>
        <button
          className="secondary-button"
          type="button"
          aria-pressed={selectedMonth === item.mes}
          onClick={() => onSelectMonth(item.mes)}
        >
          {selectedMonth === item.mes ? "Mês selecionado" : "Ver mês no painel"} <Icon name="arrow" size={16} />
        </button>
      </li>)}
    </ul> : <p className="ai-ok-note">
      Nenhum mês extrapolou o limite de {thresholdLabel} desvios acima do previsto pelo seu histórico.
    </p>}

    <dl className="pd-metrics ai-metrics">
      <div>
        <dt>Gasto típico</dt>
        <dd>
          <strong>{money(profile.gasto_tipico)}</strong>
          <small>Média dos {profile.meses_no_treino} meses normais</small>
        </dd>
      </div>
      <div>
        <dt>Tendência mensal</dt>
        <dd>
          <strong>{trendSign}{money(Math.abs(profile.tendencia_mensal))}</strong>
          <small>Variação normal (s): ±{money(profile.variacao_normal)}</small>
        </dd>
      </div>
      <div>
        <dt>Previsão ({profile.proximo_mes.rotulo})</dt>
        <dd>
          <strong>{money(profile.proximo_mes.esperado)}</strong>
          <small>Alerta acima de {money(profile.proximo_mes.limite_alerta)}</small>
        </dd>
      </div>
      <div>
        <dt>Comprometimento da renda</dt>
        <dd>
          {profile.comprometimento_da_renda !== null && data.renda_mensal
            ? <><strong>{percent(profile.comprometimento_da_renda)}</strong><small>sobre renda de {money(data.renda_mensal)}</small></>
            : <><strong>Não informada</strong><small><a className="xref" href="/app/account">Informar na página Conta</a></small></>}
        </dd>
      </div>
    </dl>

    <details className="ai-details">
      <summary>Ver avaliação mês a mês e limitações do modelo</summary>
      <div className="panel-stack ai-details-body">
        <p className="pd-hint">
          Cada mês é avaliado deixando-o de fora do treino (<em>leave-one-out</em>), para que um mês muito alto não puxe a
          própria reta para cima. Ajuste da reta normal: R² = {decimalFormat.format(profile.r2)}.
        </p>

        <div className="pd-scroll" tabIndex={0} role="region" aria-label="Avaliação mês a mês da regressão linear">
          <table className="pd-table">
            <thead>
              <tr>
                <th scope="col">Mês</th>
                <th scope="col">Gasto real</th>
                <th scope="col">Esperado</th>
                <th scope="col">Limite de alerta</th>
                <th scope="col">Desvios</th>
                <th scope="col">Situação</th>
              </tr>
            </thead>
            <tbody>
              {evaluatedMonths.map((item) => <tr className={item.anomalia ? "is-anomaly-row" : undefined} key={item.mes}>
                <td>
                  <button className="transaction-link" type="button" onClick={() => onSelectMonth(item.mes)}>
                    {formatMonth(item.mes)}
                  </button>
                </td>
                <td>{money(item.total)}</td>
                <td>{item.esperado !== undefined ? money(item.esperado) : "—"}</td>
                <td>{item.limite_alerta !== undefined ? money(item.limite_alerta) : "—"}</td>
                <td>{item.desvios !== undefined ? decimalFormat.format(item.desvios) : "—"}</td>
                <td>
                  <span className={`budget-status${item.anomalia ? " is-over" : ""}`}>
                    {item.anomalia ? "Anomalia" : "Normal"}
                  </span>
                </td>
              </tr>)}
            </tbody>
          </table>
        </div>

        <div className="ai-limitations">
          <h3>Por que o modelo não é 100% assertivo</h3>
          <ul>
            <li><strong>Poucos pontos no estudo:</strong> com {analyzed} meses, qualquer variação pontual pesa muito na inclinação da reta e no desvio residual.</li>
            <li><strong>Sem sazonalidade:</strong> uma reta simples não sabe distinguir meses naturalmente mais caros (como dezembro, férias ou 13º salário) de gastos fora de controle.</li>
            <li><strong>Comportamento não linear:</strong> finanças pessoais mudam em degraus (mudança de aluguel, novo financiamento) que uma regressão linear aproxima apenas em média.</li>
            <li><strong>Limiar estatístico:</strong> o corte de {thresholdLabel} desvios é uma escolha de compromisso entre evitar falsos alertas e não deixar anomalias passarem.</li>
          </ul>
          {warnings.length > 0 && <ul className="ai-warnings">
            {warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>}
        </div>
      </div>
    </details>
  </section>;
}
