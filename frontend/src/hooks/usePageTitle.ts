import { useEffect } from "react";

/** Troca o título da aba do navegador enquanto a página está aberta. */
export default function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
