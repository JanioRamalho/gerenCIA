export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  constructor(public status: number, message: string, public fields: FieldErrors = {}) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = RequestInit & { json?: unknown };
const unreachable = "Não foi possível falar com o servidor. Verifique a conexão e tente de novo.";
const generic = "Não foi possível concluir agora. Tente de novo em instantes.";

/** Transporte comum de autenticação, arquivos e análises; as telas decidem a navegação. */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T | null> {
  const { json, ...init } = options;
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (json !== undefined) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      credentials: "same-origin",
      headers,
      body: json === undefined ? init.body : JSON.stringify(json),
    });
  } catch (error) {
    if (init.signal?.aborted || (error instanceof DOMException && error.name === "AbortError")) throw error;
    throw new ApiError(0, unreachable);
  }
  if (response.status === 204) return null;

  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw new ApiError(response.status, generic);
  }
  if (!response.ok) {
    const data = body as { detail?: unknown; fields?: unknown } | null;
    const fields = data?.fields && typeof data.fields === "object" && !Array.isArray(data.fields)
      ? Object.fromEntries(Object.entries(data.fields).filter(([, value]) => typeof value === "string")) as FieldErrors
      : {};
    throw new ApiError(response.status, typeof data?.detail === "string" ? data.detail : generic, fields);
  }
  return body as T;
}
