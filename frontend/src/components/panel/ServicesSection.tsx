import { useEffect, useState } from "react";
import { getAnalytics, leaveIfSignedOut, money, type AnalyticsData, type ServiceAnalysis } from "../../panel/api";
import Icon from "../Icon";
import ComparisonBars from "./ComparisonBars";
import { dayLabel, shortMonth } from "./formatDate";

const total = (services: ServiceAnalysis[]) => services.reduce((sum, item) => sum + Math.round(Number(item.total_periodo) * 100), 0) / 100;
const merchantLink = (month: string | null, merchant: string) => {
  const query = new URLSearchParams({ merchant, eligibility: "included" });
  if (month) query.set("month", month);
  return `/app/transactions?${query}`;
};

export default function ServicesSection({ data, reference }: { data: AnalyticsData; reference: string }) {
  const [referenceData, setReferenceData] = useState<{ month: string; services: ServiceAnalysis[] } | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setReferenceData(null);
    setFailed(false);
    if (!data.mes || !reference) return;
    const controller = new AbortController();
    getAnalytics(reference, null, controller.signal).then((result) => {
      if (!controller.signal.aborted) setReferenceData({ month: reference, services: result.servicos });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted && !leaveIfSignedOut(error)) setFailed(true);
    });
    return () => controller.abort();
  }, [data.mes, reference, attempt]);

  const comparable = data.mes && reference;
  const ready = referenceData?.month === reference;
  const maximum = Math.max(1, ...data.servicos.map((item) => Number(item.total_periodo)));
  const services = [...data.servicos].sort((a, b) =>
    Number(b.classificacoes.includes("assinatura_identificada")) - Number(a.classificacoes.includes("assinatura_identificada"))
    || Number(b.total_periodo) - Number(a.total_periodo));
  return <section className="gc-services gc-open-section" aria-labelledby="services-heading">
    <div className="gc-section-heading">
      <div><h2 id="services-heading">Assinaturas e recorrências</h2>
        <p>Serviços identificados nos seus arquivos.</p></div>
    </div>
    {services.length || comparable || (ready && referenceData.services.length) ? <div className="gc-services-layout">
      <div>
        {comparable ? <>
          <ComparisonBars label="Gasto observado com assinaturas e recorrências nos dois meses" entries={[
            { label: shortMonth(reference), value: ready ? total(referenceData.services) : null },
            { label: shortMonth(data.mes!), value: total(data.servicos) },
          ]} />
          {!ready && !failed ? <p className="gc-footnote" role="status">Carregando o mês de referência…</p> : null}
          {failed ? <p className="pd-error" role="alert">Não foi possível comparar as recorrências. <button className="text-button" onClick={() => setAttempt((value) => value + 1)}>Tentar de novo</button></p> : null}
        </> : <ul className="gc-service-bars" aria-label="Gasto por serviço no período">
          {data.servicos.map((service) => <li key={service.estabelecimento}>
            <span>{service.estabelecimento}</span><strong>{money(Number(service.total_periodo))}</strong>
            <span className="gc-service-track" aria-hidden="true"><i style={{ width: `${Math.max(0, Number(service.total_periodo)) / maximum * 100}%` }} /></span>
          </li>)}
        </ul>}
        <p className="gc-footnote">Valores observados no período, sem previsão de cobranças futuras.</p>
      </div>
      <ul className="gc-service-details">
        {services.map((service) => <li key={service.estabelecimento}>
          <a href={merchantLink(data.mes, service.estabelecimento)}>
            <strong>{service.estabelecimento}</strong><b>{money(Number(service.total_periodo))}<small>no período</small></b>
          </a>
          <details className="gc-service-evidence">
            <summary>{service.classificacoes.includes("assinatura_identificada") ? "Assinatura identificada" : "Recorrência confirmada"}{service.classificacoes.length > 1 ? " e recorrente" : ""}<Icon name="arrow" size={14} /></summary>
            <p>{service.classificacoes.includes("assinatura_identificada") ? "Assinatura identificada pelo nome do serviço. " : ""}{service.classificacoes.includes("recorrencia_confirmada") ? "Recorrência confirmada pelas cobranças repetidas no histórico." : "A recorrência ainda não foi confirmada no histórico."}</p>
            <dl>
              <div><dt>Base mensal ({shortMonth(service.mes_base)})</dt><dd>{money(Number(service.base_mensal))}</dd></div>
              <div><dt>Extrapolação de 12 meses</dt><dd>{money(Number(service.anualizado))}</dd></div>
            </dl>
            <p>Última cobrança: {dayLabel(service.ultima_cobranca)}. Evidência: {service.meses_evidencia.map(shortMonth).join(", ")}.{service.lacunas.length ? ` Sem dados em ${service.lacunas.map(shortMonth).join(", ")}.` : ""}</p>
          </details>
        </li>)}
        {!data.servicos.length ? <li className="pd-empty">Nenhum serviço identificado no mês selecionado.</li> : null}
      </ul>
    </div> : <p className="pd-empty">Nenhuma assinatura ou recorrência identificada neste período. A confirmação de recorrência exige pelo menos dois meses de dados.</p>}
    <p className="gc-footnote">Assinaturas são identificadas pelo nome do serviço; recorrências são confirmadas pela repetição das cobranças no histórico. Compras parceladas ficam de fora.</p>
  </section>;
}
