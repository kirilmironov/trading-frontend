import axios from 'axios';

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