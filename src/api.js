import axios from 'axios';

const isLocalDevelopment = ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const API_BASE = isLocalDevelopment
  ? (process.env.REACT_APP_API_BASE || 'http://localhost:8080/api')
  : '/api';

export const WS_URL = isLocalDevelopment
  ? 'http://localhost:8080/ws-trading'
  : `${window.location.protocol}//${window.location.host}/ws-trading`;

const api = axios.create({
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});
let csrfToken = null;

api.interceptors.request.use((config) => {
  if (csrfToken && !['get', 'head', 'options'].includes(config.method?.toLowerCase())) {
    config.headers = config.headers || {};
    config.headers['X-XSRF-TOKEN'] = csrfToken;
  }
  return config;
});

export async function loadCsrfToken(apiBase) {
  const response = await api.get(`${apiBase}/auth/csrf`);
  csrfToken = response.data.token;
}

export default api;