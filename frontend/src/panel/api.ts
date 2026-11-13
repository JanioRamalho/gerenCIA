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

export type DashboardData = {
  tem_dados: boolean;
  arquivos: number;
  mes?: string | null;
  resumo?: Resumo | null;
  variacao?: { mes_anterior: string; rotulo_anterior: string; total_anterior: number; diferenca: number; percentual: number } | null;
  por_mes?: { mes: string; rotulo: string; total: number }[];
  meses_com_gastos?: number;
  por_categoria?: { categoria: string; total: number; quantidade: number; participacao: number }[];
  maiores_lancamentos?: Lancamento[];
  lancamentos?: Lancamento[];
  recorrentes?: { estabelecimento: string; valor: number; dia_mais_recente: number; total_por_mes: number; custo_no_ano: number; meses: number }[];
  assinaturas_pelo_nome?: { estabelecimento: string; valor: number; ultima_cobranca: string; custo_no_ano: number }[];
};

const unreachable = "Não foi possível falar com o servidor. Verifique a conexão e tente de novo.";
const generic = "Não foi possível concluir agora. Tente de novo em instantes.";

async function call<T>(path: string, init: { method?: string; body?: BodyInit; headers?: Record<string, string> } = {}): Promise<T | null> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      credentials: "same-origin",
      method: init.method,
      body: init.body,
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

/** Quem perdeu a sessão volta para o login. */
export function leaveIfSignedOut(error: unknown): boolean {
  if (error instanceof ApiError && error.status === 401) {
    window.location.replace("/login");
    return true;
  }
  return false;
}

export const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
export const percent = (value: number, digits = 0) => new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: digits }).format(value);
