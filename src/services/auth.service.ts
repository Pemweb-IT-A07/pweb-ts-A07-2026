import type { SessionUser, UserRole } from "../types/index.js";
import { fetchUserDetail, loginRequest } from "./api.service.js";
import { clearSession, getSession, setSession } from "./storage.service.js";

export async function login(username: string, password: string): Promise<SessionUser> {
  const authResult = await loginRequest({ username, password });
  const detail = await fetchUserDetail(authResult.id, authResult.accessToken);

  const session: SessionUser = {
    id: authResult.id,
    username: authResult.username,
    firstName: authResult.firstName,
    role: detail.role,
    token: authResult.accessToken,
  };

  setSession(session);
  return session;
}

export function logout(): void {
  clearSession();
  window.location.href = "login.html";
}

export function isAdminRole(role: UserRole): boolean {
  return role === "admin" || role === "moderator";
}

/** Redirect ke login.html bila belum ada sesi. Mengembalikan null bila mengarahkan ulang. */
export function enforceLogin(): SessionUser | null {
  const session = getSession();
  if (!session) {
    window.location.href = "login.html";
    return null;
  }
  return session;
}

/** Redirect ke login.html bila belum login atau role bukan admin/moderator. */
export function enforceAdmin(): SessionUser | null {
  const session = enforceLogin();
  if (!session) return null;
  if (!isAdminRole(session.role)) {
    window.location.href = "login.html";
    return null;
  }
  return session;
}

export function redirectAfterLogin(session: SessionUser): void {
  if (isAdminRole(session.role)) {
    window.location.href = "index.html";
  } else {
    window.location.href = "ambil-antrian.html";
  }
}
