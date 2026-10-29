import { useCallback, useEffect, useRef, useState } from "react";
import {
  categories, initialDemoState, monthKeys,
  type Category, type DemoFocus, type DemoPreset, type DemoState, type Period,
} from "../components/dashboard/demoModel";

const validPeriods = new Set<Period>([...monthKeys, "quarter"]);
const validCategories = new Set<Category>(categories.map((item) => item.name));

/**
 * Lê o recorte da demonstração do endereço da página, por exemplo
 * "/?period=jul&category=Lazer". Valores desconhecidos voltam ao padrão,
 * porque o endereço pode ter sido digitado ou editado à mão.
 */
function readDemoState(): DemoState {
  const params = new URLSearchParams(window.location.search);
  const period = params.get("period") as Period | null;
  const category = params.get("category") as Category | null;

  let validPeriod = initialDemoState.period;
  if (period && validPeriods.has(period)) {
    validPeriod = period;
  }

  let validCategory: Category | null = null;
  if (category && validCategories.has(category)) {
    validCategory = category;
  }

  let chart = initialDemoState.chart;
  if (params.get("chart") === "donut") {
    chart = "donut";
  }

  return { period: validPeriod, category: validCategory, chart };
}

/**
 * Escreve o recorte nos parâmetros do endereço. Os valores padrão não
 * aparecem, para que o endereço da página inicial continue limpo.
 */
function writeDemoParams(params: URLSearchParams, state: DemoState) {
  if (state.period === initialDemoState.period) {
    params.delete("period");
  } else {
    params.set("period", state.period);
  }

  if (state.category) {
    params.set("category", state.category);
  } else {
    params.delete("category");
  }

  if (state.chart === initialDemoState.chart) {
    params.delete("chart");
  } else {
    params.set("chart", state.chart);
  }
}

/** O id do bloco da demonstração que recebe a rolagem. */
function targetFor(focus: DemoFocus) {
  return `demo-${focus}`;
}

/** O endereço que abre um recorte da demonstração, usado nos links das figuras. */
export function demoHref(preset: DemoPreset) {
  const params = new URLSearchParams();
  writeDemoParams(params, { ...initialDemoState, ...preset });
  const query = params.toString();
  return `/${query ? `?${query}` : ""}#${targetFor(preset.focus)}`;
}

/**
 * Guarda o recorte da demonstração (período, categoria e tipo de gráfico) e o
 * mantém igual ao endereço da página. Assim o recorte pode ser compartilhado
 * por link, e os botões de voltar e avançar do navegador funcionam.
 */
export default function useDemoExperience() {
  const [state, setState] = useState<DemoState>(readDemoState);
  // stateRef guarda o recorte mais recente para o update, que é criado uma
  // vez só e por isso não enxergaria o state atualizado.
  const stateRef = useRef(state);

  // O evento popstate dispara quando a pessoa usa voltar ou avançar.
  useEffect(() => {
    function readStateFromAddress() {
      const next = readDemoState();
      stateRef.current = next;
      setState(next);
    }
    window.addEventListener("popstate", readStateFromAddress);
    return () => window.removeEventListener("popstate", readStateFromAddress);
  }, []);

  const update = useCallback((patch: Partial<DemoState>, focus?: DemoFocus) => {
    const next = { ...stateRef.current, ...patch };
    stateRef.current = next;

    // Os outros parâmetros que já estiverem no endereço são mantidos.
    const params = new URLSearchParams(window.location.search);
    writeDemoParams(params, next);
    const query = params.toString();
    const hash = focus ? `#${targetFor(focus)}` : window.location.hash;
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${hash}`;
    // pushState muda o endereço sem recarregar a página e cria um passo no histórico.
    window.history.pushState(null, "", nextUrl);
    setState(next);

    if (focus) {
      scrollToBlock(targetFor(focus));
    }
  }, []);

  return { state, update };
}

/** Rola a página até o bloco, sem animação para quem pediu menos movimento. */
function scrollToBlock(id: string) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behavior = reduceMotion ? "auto" : "smooth";
  // requestAnimationFrame espera o React desenhar o recorte novo antes de rolar.
  window.requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior, block: "start" }));
}
