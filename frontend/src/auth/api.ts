export type User = { id: string; code: number; name: string; email: string; created_at: string };

export type FieldErrors = Record<string, string>;

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

async function request<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T | null> {
  const { json, ...rest } = init;
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      credentials: "same-origin",
      ...rest,
      headers: { Accept: "application/json", ...(json === undefined ? {} : { "Content-Type": "application/json" }) },
      body: json === undefined ? undefined : JSON.stringify(json),
    });
  } catch {
    throw new ApiError(0, unreachable);
  }
  if (response.status === 204) return null;

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // A proxy error page or an empty body is not JSON; fall through to the generic message.
  }
  if (!response.ok) {
    const data = (body ?? {}) as { detail?: unknown; fields?: unknown };
    const detail = typeof data.detail === "string" ? data.detail : generic;
    const fields = data.fields && typeof data.fields === "object" ? (data.fields as FieldErrors) : {};
    throw new ApiError(response.status, detail, fields);
  }
  return body as T;
}

/** The signed-in user, or null when there is no valid session. */
export async function getCurrentUser(): Promise<User | null> {
  try {
    return await request<User>("/auth/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export const register = (input: { name: string; email: string; password: string }) =>
  request<User>("/auth/register", { method: "POST", json: input }) as Promise<User>;

export const login = (input: { email: string; password: string }) =>
  request<User>("/auth/login", { method: "POST", json: input }) as Promise<User>;

export const logout = () => request<null>("/auth/logout", { method: "POST" });
