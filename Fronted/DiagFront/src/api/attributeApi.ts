import api from './client';
import type { DiagramAttribute } from '../types/models';

export const getAttributes = (entityId: string) =>
  api.get<DiagramAttribute[]>(`/entities/${entityId}/attributes`).then(r => r.data);

export const createAttribute = (entityId: string, attribute: Partial<DiagramAttribute>) =>
  api.post<DiagramAttribute>(`/entities/${entityId}/attributes`, attribute).then(r => r.data);

export const updateAttribute = (id: string, attribute: Partial<DiagramAttribute>) =>
  api.put<DiagramAttribute>(`/attributes/${id}`, attribute).then(r => r.data);

export const deleteAttribute = (id: string) =>
  api.delete(`/attributes/${id}`);