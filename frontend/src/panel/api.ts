import { ApiError, request as call } from "../lib/api";
export { money, percent } from "../lib/format";

/** Um arquivo do histórico, com o resumo do que foi lido dele. */
export type UploadItem = {
  id: string;
  code: number;
  original_filename: string;
  created_at: string;
  formato: string | null;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  linhas_validas: number;
  linhas_rejeitadas: number;
  linhas_duplicadas: number;
  percentual: number | null;
  total_saidas: number | null;
  total_entradas: number | null;
  document_type?: string | null;
  reused?: boolean;
};

/** Envia um CSV ou XLSX. O arquivo vai como corpo da requisição, com o nome na URL. */
export const sendFile = (file: File, documentType?: string) =>
  call<UploadItem>(`/uploads?${new URLSearchParams({ nome: file.name, ...(documentType ? { document_type: documentType } : {}) })}`, {
    method: "POST",
    body: file,
    headers: { "Content-Type": "application/octet-stream" },
  }) as Promise<UploadItem>;

export const listUploads = () => call<UploadItem[]>("/uploads") as Promise<UploadItem[]>;

export const deleteUpload = (id: string) => call<null>(`/uploads/${id}`, { method: "DELETE" });

/** Quem perdeu a sessão volta para o login. */
export function leaveIfSignedOut(error: unknown): boolean {
  if (error instanceof ApiError && error.status === 401) {
    window.location.replace("/login");
    return true;
  }
  return false;
}

type DecimalText = string;
export type AnalyticsEntry = {
  id: string | null; data: string; descricao: string; estabelecimento: string;
  categoria: string; category_id: string | null; valor: DecimalText; tipo: string;
  contribuicao: DecimalText; parcela: string | null;
};
export type CategoryAnalysis = {
  categoria: string; category_id: string | null; total: DecimalText; quantidade: number;
  participacao: number | null;
  estatisticas: DescriptiveStats;
};
export type MonthComparison = {
  mes: string | null; mes_referencia: string | null; total: DecimalText; total_referencia: DecimalText | null;
  diferenca: DecimalText | null; percentual: number | null; motivo: string | null;
  por_categoria: { categoria: string; category_id: string | null; total: DecimalText;
    total_referencia: DecimalText; diferenca: DecimalText; percentual: number | null; motivo: string | null }[];
};
export type ServiceAnalysis = {
  estabelecimento: string; classificacoes: ("assinatura_identificada" | "recorrencia_confirmada")[];
  total_periodo: DecimalText; base_mensal: DecimalText; mes_base: string; anualizado: DecimalText;
  ultima_cobranca: string; meses_evidencia: string[]; lacunas: string[];
};
export type DescriptiveStats = {
  quantidade: number; media: DecimalText | null; mediana: DecimalText | null; minimo: DecimalText | null;
  maximo: DecimalText | null; amplitude: DecimalText | null; desvio_padrao: DecimalText | null;
  q1: DecimalText | null; q3: DecimalText | null; iqr: DecimalText | null;
  moda_categoria: string[]; moda_estabelecimento: string[];
  histograma: { inicio: DecimalText; fim: DecimalText; quantidade: number }[];
  motivo_dispersao: string | null;
};
export type AnalyticsData = {
  tem_dados: boolean; arquivos: number; mes: string | null; meses_disponiveis: string[];
  cobertura: { inicio: string | null; fim: string | null; mes_em_andamento: boolean };
  resumo: { total_saidas: DecimalText; total_entradas: DecimalText; total_pagamentos: DecimalText;
    total_compras: DecimalText; total_tarifas: DecimalText; total_estornos: DecimalText;
    quantidade_saidas: number; quantidade_transacoes: number; media_por_dia: DecimalText;
    dias: number; maior_categoria: string | null } | null;
  por_categoria: CategoryAnalysis[]; por_mes: { mes: string; rotulo: string; total: DecimalText | null }[];
  por_dia: { data: string; total: DecimalText }[]; estatisticas: DescriptiveStats;
  comparacao: MonthComparison | null; servicos: ServiceAnalysis[]; recentes: AnalyticsEntry[];
  por_estabelecimento: { estabelecimento: string; total: DecimalText; quantidade: number }[];
  maiores_lancamentos: AnalyticsEntry[];
};

export const getAnalytics = (month = "latest", referenceMonth?: string | null, signal?: AbortSignal) => {
  const params = new URLSearchParams({ month });
  if (referenceMonth) params.set("reference_month", referenceMonth);
  return call<AnalyticsData>(`/analytics/summary?${params}`, { signal }) as Promise<AnalyticsData>;
};

export type CategoryItem = { id: string; code: number; name: string; color: string | null; is_active: boolean };
export type TransactionItem = {
  id: string; upload_id: string; source_row: number; source_sheet: string | null; date: string;
  description: string; merchant: string; amount: DecimalText; transaction_type: string;
  category_id: string | null; category_name: string; category_source: string;
  is_duplicate: boolean; is_suspected_duplicate: boolean; contribution: DecimalText;
};
export type TransactionPage = {
  items: TransactionItem[]; total: number; page: number; page_size: number; month: string | null;
  filters: Record<string, unknown>;
  aggregates: { net_spending: DecimalText; income: DecimalText; payments: DecimalText; count: number };
};
export const listCategories = (signal?: AbortSignal) => call<CategoryItem[]>("/categories", { signal }) as Promise<CategoryItem[]>;
export const getTransactions = (filters: URLSearchParams | Record<string, string>, signal?: AbortSignal) =>
  call<TransactionPage>(`/transactions?${new URLSearchParams(filters)}`, { signal }) as Promise<TransactionPage>;
export const getTransaction = (id: string, signal?: AbortSignal) =>
  call<TransactionItem>(`/transactions/${id}`, { signal }) as Promise<TransactionItem>;
export const correctCategory = (id: string, categoryId: string, saveRule = false) =>
  call<TransactionItem>(`/transactions/${id}/category`, { method: "PATCH", json: { category_id: categoryId, save_rule: saveRule } }) as Promise<TransactionItem>;

export type BudgetItem = {
  id: string | null; category_id: string; category_name: string; amount: DecimalText | null;
  spent: DecimalText; remaining: DecimalText | null; used_percentage: number | null; is_active: boolean;
};
export type BudgetData = { month: string; coverage_available: boolean; items: BudgetItem[] };
export type NotificationItem = {
  id: string; category_id: string; category_name: string; month: string; threshold: number;
  amount: DecimalText; limit_amount: DecimalText; created_at: string; read_at: string | null;
};
export type NotificationData = { items: NotificationItem[]; unread_count: number };
export const getBudgets = (month: string, signal?: AbortSignal) =>
  call<BudgetData>(`/budgets?${new URLSearchParams({ month })}`, { signal }) as Promise<BudgetData>;
export const saveBudget = (categoryId: string, amount: string) =>
  call<BudgetData>(`/budgets/${categoryId}`, { method: "PUT", json: { amount } }) as Promise<BudgetData>;
export const removeBudget = (categoryId: string) => call<null>(`/budgets/${categoryId}`, { method: "DELETE" });
export const getNotifications = (signal?: AbortSignal) => call<NotificationData>("/notifications", { signal }) as Promise<NotificationData>;
export const readNotifications = (id?: string) =>
  call<NotificationData>(id ? `/notifications/${id}/read` : "/notifications/read-all", { method: "POST" }) as Promise<NotificationData>;

export type QualityDimension = { percentual: number | null; quantidade: number; total: number; motivo: string | null; suspeitas?: number; contexto?: string };
export type UploadDetail = { arquivo: UploadItem; dimensoes: Record<string, QualityDimension> | null;
  totais: Record<string, DecimalText> | null;
  rejeitadas: { linha: number; codigo: string; mensagem: string; conteudo: Record<string, unknown> }[] };
export const getUploadDetail = (id: string, signal?: AbortSignal) =>
  call<UploadDetail>(`/uploads/${id}`, { signal }) as Promise<UploadDetail>;
