
import { api } from "./api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: AuthUser;
  };
}

interface CurrentUserResponse {
  success: boolean;
  message: string;
  data: AuthUser;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const registerUser = async (
  payload: RegisterInput
) => {
  const response = await api.post<AuthResponse>(
    "/auth/register",
    payload
  );

  return response.data.data;
};

export const loginUser = async (
  payload: LoginInput
) => {
  const response = await api.post<AuthResponse>(
    "/auth/login",
    payload
  );

  return response.data.data;
};

export const getCurrentUser = async (): Promise<AuthUser> => {
  const response = await api.get<CurrentUserResponse>(
    "/auth/me"
  );

  return response.data.data;
};
