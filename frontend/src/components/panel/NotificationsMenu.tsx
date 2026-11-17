import { useEffect, useRef, useState } from "react";
import { getNotifications, leaveIfSignedOut, readNotifications, type NotificationData } from "../../panel/api";
import { money } from "../../lib/format";
import { monthLabel } from "./formatDate";
import Icon from "../Icon";

export default function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NotificationData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const requestNumber = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      const request = ++requestNumber.current;
      try {
        const result = await getNotifications(controller.signal);
        if (!controller.signal.aborted && request === requestNumber.current) {
          setData(result);
          setError("");
        }
      } catch (failure) {
        if (!controller.signal.aborted && request === requestNumber.current && !leaveIfSignedOut(failure)) setError("Não foi possível carregar os avisos.");
      }
    };
    void load();
    window.addEventListener("gerencia:data-changed", load);
    return () => {
      controller.abort();
      window.removeEventListener("gerencia:data-changed", load);
    };
  }, [attempt]);
  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent && event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
      if (event instanceof PointerEvent && !container.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", dismiss);
    document.addEventListener("pointerdown", dismiss);
    return () => {
      document.removeEventListener("keydown", dismiss);
      document.removeEventListener("pointerdown", dismiss);
    };
  }, [open]);
  async function markRead(id?: string) {
    const request = ++requestNumber.current;
    setBusy(true);
    setError("");
    try {
      const result = await readNotifications(id);
      if (request === requestNumber.current) setData(result);
    }
    catch (failure) {
      if (!leaveIfSignedOut(failure)) setError("Não foi possível marcar os avisos como lidos.");
    }
    finally {
      setBusy(false);
    }
  }

  return <div className="gc-notifications" ref={container} onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <button className="gc-button gc-notification-trigger" type="button" ref={trigger} aria-expanded={open} aria-controls="notifications-panel" aria-label={`Avisos${data?.unread_count ? `, ${data.unread_count} não lidos` : ""}`} onClick={() => setOpen((value) => !value)}>
      <Icon name="bell" size={20} />{data?.unread_count ? <span>{data.unread_count}</span> : null}</button>
    {open ? <section id="notifications-panel" className="gc-notification-panel gc-surface" aria-labelledby="notification-heading">
      <div className="gc-section-heading">
        <h2 id="notification-heading">Seus avisos</h2>
        <button className="text-button" disabled={busy || !data?.unread_count} onClick={() => void markRead()}>Marcar todos como lidos</button>
      </div>
      {error ? <p className="pd-error" role="alert">{error} <button className="text-button" onClick={() => {
        setError("");
        setAttempt((value) => value + 1);
      }}>Tentar de novo</button>
      </p> : null}
      {data?.items.length ? <ul className="gc-notification-list">{data.items.map((item) => <li key={item.id} className={item.read_at ? "" : "is-unread"}>
        <strong>{item.category_name}: {item.threshold >= 100 ? "limite ultrapassado" : "aproximação do limite"}</strong>
        <p>Gasto de {money(item.amount)} para um limite de {money(item.limit_amount)} em {monthLabel(item.month)}.</p>
        <small>Aviso de {new Date(item.created_at).toLocaleDateString("pt-BR")}. O gasto atual pode ter mudado.</small>
        <div className="gc-filter-actions">
          <a className="text-link" href={`/app/budgets?month=${item.month}`}>Conferir situação atual</a>{!item.read_at ? <button className="text-button" disabled={busy} onClick={() => void markRead(item.id)}>Marcar como lido</button> : <span>Lido</span>}</div>
      </li>)}</ul> : !error ? <p className="pd-empty">{data ? "Nenhum aviso de limite por enquanto." : "Carregando avisos…"}</p> : null}
    </section> : null}
  </div>;
}
