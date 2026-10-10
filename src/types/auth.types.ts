export type UserRole = "admin" | "moderator" | "user";

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginApiResponse {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  image: string;
  accessToken: string;
  refreshToken: string;
}

export interface UserDetailResponse {
  id: number;
  username: string;
  firstName: string;
  role: UserRole;
}

export interface SessionUser {
  id: number;
  username: string;
  firstName: string;
  role: UserRole;
  token: string;
}
