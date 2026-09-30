import { useCallback, useEffect, useRef, useState } from "react";
import {
  categories, initialDemoState, monthKeys,
  type Category, type DemoFocus, type DemoPreset, type DemoState, type Period,
} from "../components/dashboard/demoModel";

const validPeriods = new Set<Period>([...monthKeys, "quarter"]);
const validCategories = new Set<Category>(categories.map((item) => item.name));

function readDemoState(): DemoState {
  const params = new URLSearchParams(window.location.search);
  const period = params.get("period") as Period | null;
  const category = params.get("category") as Category | null;
  return {
    period: period && validPeriods.has(period) ? period : initialDemoState.period,
    category: category && validCategories.has(category) ? category : null,
    chart: params.get("chart") === "donut" ? "donut" : "bar",
  };
}

function targetFor(focus: DemoFocus) {
  return `demo-${focus}`;
}

export function demoHref(preset: DemoPreset) {
  const params = new URLSearchParams();
  if (preset.period && preset.period !== initialDemoState.period) params.set("period", preset.period);
  if (preset.category) params.set("category", preset.category);
  if (preset.chart && preset.chart !== initialDemoState.chart) params.set("chart", preset.chart);
  const query = params.toString();
  return `/${query ? `?${query}` : ""}#${targetFor(preset.focus)}`;
}

export default function useDemoExperience() {
  const [state, setState] = useState<DemoState>(readDemoState);
  const stateRef = useRef(state);

  useEffect(() => {
    const onPopState = () => { const next = readDemoState(); stateRef.current = next; setState(next); };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const update = useCallback((patch: Partial<DemoState>, focus?: DemoFocus) => {
    const next = { ...stateRef.current, ...patch };
    stateRef.current = next;
    const params = new URLSearchParams(window.location.search);
    if (next.period === initialDemoState.period) params.delete("period");
    else params.set("period", next.period);
    if (next.category) params.set("category", next.category);
    else params.delete("category");
    if (next.chart === initialDemoState.chart) params.delete("chart");
    else params.set("chart", next.chart);
    const hash = focus ? `#${targetFor(focus)}` : window.location.hash;
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${hash}`;
    window.history.pushState(null, "", nextUrl);
    setState(next);
    if (focus) window.requestAnimationFrame(() => document.getElementById(targetFor(focus))?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }));
  }, []);

  return { state, update };
}
