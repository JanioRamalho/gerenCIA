import { useEffect, useState } from "react";
import type { User } from "../../auth/api";
import { getDashboard, leaveIfSignedOut, type DashboardData } from "../../panel/api";
import PanelDashboard from "./PanelDashboard";
import PanelHome from "./PanelHome";

type PanelOverviewProps = {
  user: User;
};

/**
 * Início do painel (/app): busca a análise na API e escolhe o que mostrar.
 * Sem nenhum arquivo enviado, mostra as boas-vindas; com dados, o dashboard.
 */
export default function PanelOverview({ user }: PanelOverviewProps) {
  const [month, setMonth] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReloading(true);
    getDashboard(month)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setFailed(false);
      })
      .catch((error: unknown) => {
        if (cancelled || leaveIfSignedOut(error)) return;
        setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setReloading(false);
      });
    return () => { cancelled = true; };
  }, [month]);

  if (failed && data === null) {
    return <section className="panel-card panel-message" aria-labelledby="overview-error-title">
      <h1 id="overview-error-title">Não foi possível carregar a análise.</h1>
      <p>O servidor não respondeu. Confira se a API está no ar e tente de novo.</p>
      <button className="primary-button is-night" type="button" onClick={() => window.location.reload()}>Tentar de novo</button>
    </section>;
  }
  if (data === null) {
    return <p className="sr-only" role="status">Carregando a análise…</p>;
  }
  if (!data.tem_dados) {
    return <PanelHome user={user} />;
  }
  return <PanelDashboard user={user} data={data} month={month} onMonthChange={setMonth} busy={reloading} failed={failed} />;
}
