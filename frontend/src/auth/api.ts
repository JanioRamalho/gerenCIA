import { ApiError, request } from "../lib/api";
export { ApiError } from "../lib/api";
export type { FieldErrors } from "../lib/api";
export type User = { id: string; code: number; name: string; email: string; created_at: string };

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

export const deleteAccount = () => request<null>("/auth/me", { method: "DELETE" });
