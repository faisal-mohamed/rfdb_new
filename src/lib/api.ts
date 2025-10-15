// API utility function to handle basePath
// For client-side calls, we need to use the full URL with basePath
const API_BASE = '/rfp';

export const apiCall = async (endpoint: string, options?: RequestInit) => {
  const url = `${API_BASE}${endpoint}`;
  console.log('API Call:', url); // Debug log
  return fetch(url, options);
};

// Convenience methods
export const apiGet = (endpoint: string) => apiCall(endpoint);
export const apiPost = (endpoint: string, data?: any) => 
  apiCall(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined
  });
export const apiPut = (endpoint: string, data?: any) => 
  apiCall(endpoint, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined
  });
export const apiDelete = (endpoint: string) => 
  apiCall(endpoint, { method: 'DELETE' });
