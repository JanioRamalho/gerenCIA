import { ApiError } from "../auth/api";

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
  total_saidas: number;
  total_entradas: number;
};

export type Lancamento = {
  data: string;
  estabelecimento: string;
  descricao: string;
  categoria: string;
  valor: number;
  parcela: string | null;
};

export type Resumo = {
  total_saidas: number;
  total_entradas: number;
  quantidade_saidas: number;
  media: number;
  mediana: number;
  maior: number;
  media_por_dia: number;
  dias: number;
  periodo_inicio: string;
  periodo_fim: string;
};

export type MonthlySpending = { mes: string; rotulo: string; total: number };

export type DashboardData = {
  tem_dados: boolean;
  arquivos: number;
  mes?: string | null;
  resumo?: Resumo | null;
  variacao?: { mes_anterior: string; rotulo_anterior: string; total_anterior: number; diferenca: number; percentual: number } | null;
  por_mes?: MonthlySpending[];
  meses_com_gastos?: number;
  por_categoria?: { categoria: string; total: number; quantidade: number; participacao: number; cor: string | null }[];
  maiores_lancamentos?: Lancamento[];
  lancamentos?: Lancamento[];
  recorrentes?: { estabelecimento: string; valor: number; dia_mais_recente: number; total_por_mes: number; custo_no_ano: number; meses: number }[];
  assinaturas_pelo_nome?: { estabelecimento: string; valor: number; ultima_cobranca: string; custo_no_ano: number }[];
};

const unreachable = "Não foi possível falar com o servidor. Verifique a conexão e tente de novo.";
const generic = "Não foi possível concluir agora. Tente de novo em instantes.";

async function call<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      credentials: "same-origin",
      method: init.method,
      body: init.body,
      signal: init.signal,
      headers: { Accept: "application/json", ...init.headers },
    });
  } catch {
    throw new ApiError(0, unreachable);
  }
  if (response.status === 204) return null;

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Página de erro do proxy ou corpo vazio: segue para a mensagem genérica.
  }
  if (!response.ok) {
    const detail = (body as { detail?: unknown } | null)?.detail;
    throw new ApiError(response.status, typeof detail === "string" ? detail : generic);
  }
  return body as T;
}

/** Envia um CSV ou XLSX. O arquivo vai como corpo da requisição, com o nome na URL. */
export const sendFile = (file: File) =>
  call<UploadItem>(`/uploads?nome=${encodeURIComponent(file.name)}`, {
    method: "POST",
    body: file,
    headers: { "Content-Type": "application/octet-stream" },
  }) as Promise<UploadItem>;

export const listUploads = () => call<UploadItem[]>("/uploads") as Promise<UploadItem[]>;

export const deleteUpload = (id: string) => call<null>(`/uploads/${id}`, { method: "DELETE" });

/** Análise das transações gravadas; com `mes` (AAAA-MM), só daquele mês. */
export const getDashboard = (mes: string | null) =>
  call<DashboardData>(`/dashboard${mes ? `?mes=${mes}` : ""}`) as Promise<DashboardData>;

export type TransactionType = "purchase" | "fee" | "refund" | "payment" | "income" | "other";

export const transactionTypes: Record<TransactionType, string> = {
  purchase: "Compra", fee: "Tarifa", refund: "Estorno", payment: "Pagamento de fatura", income: "Entrada", other: "Outra movimentação",
};

export type Transaction = {
  id: string;
  date: string;
  description: string;
  merchant: string;
  amount: string;
  type: TransactionType;
  category_id: string | null;
  category: string;
  category_color: string | null;
  file: string;
  duplicate: boolean;
  installment: string | null;
  can_remember_merchant: boolean;
};

export type TransactionFilters = {
  months: string[];
  categories: { id: string; name: string; color: string | null; active: boolean }[];
};

export type TransactionPage = { total: number; page: number; pages: number; items: Transaction[] };

export const listTransactions = (params: URLSearchParams, signal: AbortSignal) =>
  call<TransactionPage>(`/transactions?${params}`, { signal }) as Promise<TransactionPage>;

export const listTransactionFilters = (signal: AbortSignal) =>
  call<TransactionFilters>("/transactions/filters", { signal }) as Promise<TransactionFilters>;

export const changeTransactionCategory = (id: string, categoryId: string, rememberMerchant: boolean) =>
  call<null>(`/transactions/${id}/category`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category_id: categoryId, remember_merchant: rememberMerchant }),
  });

export type BudgetCategory = {
  id: string;
  name: string;
  color: string | null;
  spent: string;
  amount: string | null;
  remaining: string | null;
  used: number | null;
  status: "unset" | "ok" | "near" | "over";
};

export type BudgetData = { month: string; current_month: string; categories: BudgetCategory[] };

export const listBudgets = (month: string, signal: AbortSignal) =>
  call<BudgetData>(month ? `/budgets?mes=${encodeURIComponent(month)}` : "/budgets", { signal }) as Promise<BudgetData>;

export const saveBudget = (id: string, amount: string, month: string) =>
  call<null>(`/budgets/${id}?mes=${encodeURIComponent(month)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });

export const removeBudget = (id: string, month: string) =>
  call<null>(`/budgets/${id}?mes=${encodeURIComponent(month)}`, { method: "DELETE" });

export type Notification = {
  id: string;
  category: string;
  month: string;
  threshold: 80 | 100;
  spent: string;
  budget: string;
  created_at: string;
  read_at: string | null;
};

export type NotificationData = { unread: number; items: Notification[] };

export const listNotifications = (signal: AbortSignal) =>
  call<NotificationData>("/notifications", { signal }) as Promise<NotificationData>;

export const markNotificationsRead = (id?: string) =>
  call<null>(`/notifications/read${id ? `?notification_id=${id}` : ""}`, { method: "POST" });

export function transactionLink(filters: { mes?: string; categoria?: string; arquivo?: string } = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) query.set(key, value);
  }
  return query.size ? `/app/transactions?${query}` : "/app/transactions";
}

/** Quem perdeu a sessão volta para o login. */
export function leaveIfSignedOut(error: unknown): boolean {
  if (error instanceof ApiError && error.status === 401) {
    window.location.replace("/login");
    return true;
  }
  return false;
}

const currencyFormat = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const money = (value: number | string) => currencyFormat.format(Number(value));
export const percent = (value: number, digits = 0) => new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: digits }).format(value);
