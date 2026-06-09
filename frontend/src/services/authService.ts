import { request } from './apiClient';
import { AuthUser, LoginResponse } from '../types/api.types';

type CurrentUserResponse = {
  status: 'ok';
  user: AuthUser;
};

export function login(username: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: {
      username,
      password
    }
  });
}

export async function getCurrentUser(token: string): Promise<AuthUser> {
  const response = await request<CurrentUserResponse>('/auth/me', {}, token);

  return response.user;
}
