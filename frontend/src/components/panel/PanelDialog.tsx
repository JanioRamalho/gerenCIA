import { useLayoutEffect, useRef, type ReactNode } from "react";

type PanelDialogProps = {
  title: string;
  onClose: () => void;
  busy?: boolean;
  children: ReactNode;
};

export default function PanelDialog({ title, onClose, busy, children }: PanelDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const element = dialog.current;
    const opener = document.activeElement;
    element?.showModal();
    return () => {
      element?.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  return <dialog className="panel-dialog" ref={dialog} aria-labelledby="panel-dialog-title" onCancel={(event) => {
    event.preventDefault();
    if (!busy) onClose();
  }}>
    <h2 id="panel-dialog-title">{title}</h2>
    {children}
  </dialog>;
}
