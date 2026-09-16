import api from './client';
import type { DiagramEntity, DiagramRelationship } from '../types/models';

export const getEntities = (projectId: string) =>
  api.get<DiagramEntity[]>(`/projects/${projectId}/entities`).then(r => r.data);

export const createEntity = (projectId: string, name: string) =>
  api.post<DiagramEntity>(`/projects/${projectId}/entities`, { name, posX: 100, posY: 100 })
     .then(r => r.data);

export const moveEntity = (id: string, posX: number, posY: number) =>
  api.put<DiagramEntity>(`/entities/${id}/move`, null, { params: { posX, posY } })
     .then(r => r.data);

export const deleteEntity = (id: string) =>
  api.delete(`/entities/${id}`);

export const getRelationships = (projectId: string) =>
  api.get<DiagramRelationship[]>(`/projects/${projectId}/relationships`).then(r => r.data);