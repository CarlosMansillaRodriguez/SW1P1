import api from './client';

export const downloadGeneratedBackend = async (projectId: string) => {
  const response = await api.get(`/projects/${projectId}/generate-backend`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/zip' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'backend-generado.zip');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};