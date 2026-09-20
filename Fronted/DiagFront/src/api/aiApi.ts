import api from './client';
import type { AiCommandResult } from '../types/models';

export const sendAiCommand = (projectId: string, text: string, source: 'TEXT' | 'VOICE') =>
  api.post<AiCommandResult>(`/projects/${projectId}/ai/command`, { text, source }).then(r => r.data);

export const importAiImage = (projectId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post<AiCommandResult>(`/projects/${projectId}/ai/import-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};