import api from './client';
import type { Project } from '../types/models';

export const getMyProjects = () =>
  api.get<Project[]>('/projects/mine').then(r => r.data);

export const createProject = (name: string, description: string) =>
  api.post<Project>('/projects', { name, description }).then(r => r.data);

export const joinProject = (code: string) =>
  api.post<Project>('/projects/join', null, { params: { code } }).then(r => r.data);