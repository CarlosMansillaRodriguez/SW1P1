import api from './client';
import type { AuthUser } from '../types/models';

export const login = (email: string, password: string) =>
  api.post<AuthUser>('/auth/login', { email, password }).then(r => r.data);

export const register = (name: string, email: string, password: string) =>
  api.post<AuthUser>('/auth/register', { name, email, password }).then(r => r.data);