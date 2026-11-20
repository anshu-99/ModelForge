// Central API configuration for ModelForge
export const getApiBase = () => {
  if (typeof window !== 'undefined' && window.location.port === '5173') {
    return 'http://localhost:8000/api';
  }
  return '/api';
};

export const getDownloadUrl = (jobId, asset) => {
  return `${getApiBase()}/download/${jobId}/${asset}`;
};
