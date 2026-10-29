/** O usuário como a API devolve. created_at é uma data ISO, por exemplo "2026-10-20T14:30:00Z". */
export type User = { id: string; code: number; name: string; email: string; created_at: string };

/** Mensagens por campo do formulário, por exemplo { email: "Informe um e-mail válido." }. */
export type FieldErrors = Record<string, string>;

/**
 * Erro de uma chamada à API. status é o código HTTP (0 quando o servidor nem
 * respondeu), message é o texto para mostrar e fields traz os erros por campo.
 */
export class ApiError extends Error {
  status: number;
  fields: FieldErrors;

  constructor(status: number, message: string, fields: FieldErrors = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

const unreachable = "Não foi possível falar com o servidor. Verifique a conexão e tente de novo.";
const generic = "Não foi possível concluir agora. Tente de novo em instantes.";

/**
 * Chama uma rota da API e devolve o corpo da resposta. Quando a resposta é um
 * erro, lança ApiError com a mensagem da API ou, sem ela, uma mensagem genérica.
 * O parâmetro json, quando existe, vai no corpo como JSON.
 */
async function request<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T | null> {
  const { json, ...rest } = init;
  const hasBody = json !== undefined;

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      // same-origin envia o cookie de sessão junto com a chamada.
      credentials: "same-origin",
      ...rest,
      headers: { Accept: "application/json", ...(hasBody ? { "Content-Type": "application/json" } : {}) },
      body: hasBody ? JSON.stringify(json) : undefined,
    });
  } catch {
    // fetch só falha assim quando não houve resposta nenhuma, como sem internet.
    throw new ApiError(0, unreachable);
  }

  // 204 quer dizer "deu certo, sem conteúdo".
  if (response.status === 204) {
    return null;
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Uma página de erro do proxy ou um corpo vazio não são JSON; vale a mensagem genérica.
  }

  if (!response.ok) {
    const data = (body ?? {}) as { detail?: unknown; fields?: unknown };
    const detail = typeof data.detail === "string" ? data.detail : generic;
    const fields = data.fields && typeof data.fields === "object" ? (data.fields as FieldErrors) : {};
    throw new ApiError(response.status, detail, fields);
  }
  return body as T;
}

/** Quem está logado, ou null quando não há sessão válida. */
export async function getCurrentUser(): Promise<User | null> {
  try {
    return await request<User>("/auth/me");
  } catch (error) {
    // 401 só quer dizer "ninguém logado". Os outros erros sobem para quem chamou.
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

/** Cria a conta. A API já abre a sessão, então a pessoa sai daqui logada. */
export const register = (input: { name: string; email: string; password: string }) =>
  request<User>("/auth/register", { method: "POST", json: input }) as Promise<User>;

/** Confere e-mail e senha e abre a sessão. */
export const login = (input: { email: string; password: string }) =>
  request<User>("/auth/login", { method: "POST", json: input }) as Promise<User>;

/** Encerra a sessão no servidor. */
export const logout = () => request<null>("/auth/logout", { method: "POST" });
