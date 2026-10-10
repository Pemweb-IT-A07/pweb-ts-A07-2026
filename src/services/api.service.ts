import type { LoginApiResponse, LoginPayload, UserDetailResponse } from "../types/index.js";

const API_BASE = "https://dummyjson.com";

export async function loginRequest(payload: LoginPayload): Promise<LoginApiResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: payload.username,
      password: payload.password,
      expiresInMins: 60,
    }),
  });

  if (!res.ok) {
    if (res.status === 400 || res.status === 401) {
      throw new Error("Username atau password salah.");
    }
    throw new Error(`Gagal menghubungi server (status ${res.status}).`);
  }

  return (await res.json()) as LoginApiResponse;
}

export async function fetchUserDetail(userId: number, token: string): Promise<UserDetailResponse> {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Gagal mengambil data role pengguna (status ${res.status}).`);
  }

  return (await res.json()) as UserDetailResponse;
}
