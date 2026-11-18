import { useEffect, useRef, useState } from "react";
import { leaveIfSignedOut, listNotifications, markNotificationsRead, money, type NotificationData } from "../../panel/api";
import Icon from "../Icon";
import { formatDate, formatMonth } from "./formatDate";

export default function PanelNotifications({ version }: { version: number }) {
  const [data, setData] = useState<NotificationData | null>(null);
  const [failed, setFailed] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(false);
  const [reload, setReload] = useState(0);
  const details = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    listNotifications(controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      setData(result);
      setFailed(false);
    }).catch((error: unknown) => {
      if (!controller.signal.aborted && !leaveIfSignedOut(error)) setFailed(true);
    });
    return () => controller.abort();
  }, [version, reload]);

  async function markRead(id?: string) {
    if (updating) return;
    const action = document.activeElement;
    setUpdateError(false);
    setUpdating(true);
    try {
      await markNotificationsRead(id);
      if (document.activeElement === action) trigger.current?.focus();
      setReload((value) => value + 1);
    } catch (error) {
      if (!leaveIfSignedOut(error)) setUpdateError(true);
    } finally {
      setUpdating(false);
    }
  }

  const unread = data?.unread ?? 0;
  return <details className="panel-notifications" ref={details} onBlur={(event) => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
  }} onKeyDown={(event) => {
    if (event.key === "Escape" && details.current?.open) {
      details.current.open = false;
      trigger.current?.focus();
    }
  }} onToggle={(event) => {
    if (event.currentTarget.open) setReload((value) => value + 1);
  }}>
    <summary ref={trigger} aria-label={unread ? `Notificações, ${unread} ${unread === 1 ? "não lida" : "não lidas"}` : "Notificações"}>
      <Icon name="bell" size={21} />
      {unread > 0 && <span aria-hidden="true">{unread > 99 ? "99+" : unread}</span>}
    </summary>
    <section className="notification-popover" aria-labelledby="notifications-title">
      <div className="panel-heading-row"><h2 id="notifications-title">Notificações</h2><a className="text-link" href="/app/budgets">Ver limites</a></div>
      {failed ? <p className="pd-error" role="alert">Não foi possível carregar os avisos. <button className="text-button" type="button" onClick={() => setReload((value) => value + 1)}>Tentar de novo</button></p>
        : data === null ? <p role="status">Carregando avisos…</p>
          : data.items.length === 0 ? <p className="pd-empty">Nenhum aviso de limite por enquanto.</p>
            : <>
              {unread > 0 && <button className="text-button" type="button" aria-disabled={updating} onClick={() => void markRead()}>Marcar todas como lidas</button>}
              <ul className="notification-list">
                {data.items.map((item) => <li key={item.id} data-unread={!item.read_at}>
                  <div><strong>{item.category}</strong><small>{formatDate(item.created_at)}{item.read_at ? "" : " · Não lida"}</small></div>
                  <p>{item.threshold === 100 ? "Limite ultrapassado" : "Atingiu a faixa de 80%"} em {formatMonth(item.month)}. {money(item.spent)} de {money(item.budget)}.</p>
                  {!item.read_at && <button className="text-button" type="button" aria-disabled={updating} aria-label={`Marcar aviso de ${item.category}, faixa de ${item.threshold}%, como lido`} onClick={() => void markRead(item.id)}>Marcar como lida</button>}
                </li>)}
              </ul>
            </>}
      {updateError && <p className="pd-error" role="alert">Não foi possível marcar como lida. Tente de novo.</p>}
    </section>
  </details>;
}
