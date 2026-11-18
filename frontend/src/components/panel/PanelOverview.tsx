import { useEffect, useState } from "react";
import type { User } from "../../auth/api";
import { getAnalytics, leaveIfSignedOut, type AnalyticsData } from "../../panel/api";
import AnalyticsDashboard from "./AnalyticsDashboard";
import PanelHome from "./PanelHome";

type PanelOverviewProps = {
  user: User;
};

/**
 * Início do painel (/app): busca a análise na API e escolhe o que mostrar.
 * Sem nenhum arquivo enviado, mostra as boas-vindas; com dados, o dashboard.
 */
export default function PanelOverview({ user }: PanelOverviewProps) {
  const readPeriod = () => {
    const params = new URLSearchParams(window.location.search);
    return { month: params.get("month") ?? "latest", reference: params.get("reference_month") ?? "" };
  };
  const [period, setPeriod] = useState(readPeriod);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loadedPeriod, setLoadedPeriod] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const restorePeriod = () => setPeriod(readPeriod());
    window.addEventListener("popstate", restorePeriod);
    return () => window.removeEventListener("popstate", restorePeriod);
  }, []);
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setReloading(true);
    getAnalytics(period.month, period.reference || null, controller.signal)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setLoadedPeriod(`${period.month}/${period.reference}`);
        setFailed(false);
      })
      .catch((error: unknown) => {
        if (cancelled || controller.signal.aborted || leaveIfSignedOut(error)) return;
        setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setReloading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [period.month, period.reference, attempt]);
  function changePeriod(month: string, reference: string) {
    const selectedReference = month === "all" || reference === month ? "" : reference;
    const query = new URLSearchParams({ month });
    if (selectedReference) query.set("reference_month", selectedReference);
    window.history.pushState(null, "", `/app?${query}`);
    setPeriod({ month, reference: selectedReference });
  }

  const periodChanged = loadedPeriod !== `${period.month}/${period.reference}`;
  if (failed && (data === null || periodChanged)) {
    return <section className="panel-card panel-message" aria-labelledby="overview-error-title">
      <h1 id="overview-error-title">Não foi possível carregar a análise.</h1>
      <p>O servidor não respondeu. Verifique sua conexão e tente novamente.</p>
      <button className="primary-button is-night" type="button" onClick={() => setAttempt((value) => value + 1)}>Tentar de novo</button>
    </section>;
  }
  if (data === null || periodChanged) {
    return <div className="gc-loading" role="status">
      <span className="gc-loading-mark" />
      <p>Organizando a sua análise…</p>
    </div>;
  }
  if (!data.meses_disponiveis.length) {
    return <PanelHome user={user} />;
  }
  return <AnalyticsDashboard data={data} month={period.month} reference={period.reference || data.comparacao?.mes_referencia || ""} onPeriodChange={changePeriod} busy={reloading} failed={failed} onRetry={() => setAttempt((value) => value + 1)} />;
}
