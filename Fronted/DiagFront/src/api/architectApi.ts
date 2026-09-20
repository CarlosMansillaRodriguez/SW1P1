import api from './client';

export const exportArchitect = async (projectId: string) => {
  const response = await api.get(`/projects/${projectId}/export/architect`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'diagrama.architect');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const importArchitect = (projectId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/projects/${projectId}/import/architect`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};