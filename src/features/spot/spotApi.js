import api from '../../api';

export async function fetchSpotStocks(apiBase) {
  const response = await api.get(`${apiBase}/stocks`);
  return response.data;
}

export async function fetchSpotOrders(apiBase) {
  const response = await api.get(`${apiBase}/orders`);
  return response.data;
}

export async function fetchSpotPositions(apiBase) {
  const response = await api.get(`${apiBase}/positions/open`);
  return response.data;
}

export async function fetchSpotBalance(apiBase) {
  const response = await api.get(`${apiBase}/users/balance`);
  return response.data.balance;
}

export async function placeSpotOrder(apiBase, payload) {
  const response = await api.post(`${apiBase}/orders`, payload);
  return response.data;
}

export async function cancelSpotOrder(apiBase, orderId) {
  return api.delete(`${apiBase}/orders/${orderId}`);
}

export async function depositToSpotAccount(apiBase, amount) {
  const response = await api.post(`${apiBase}/users/deposit?amount=${amount}`);
  return response.data;
}

export async function fetchSpotOcoOrders(apiBase) {
  const response = await api.get(`${apiBase}/spot/oco`);
  return response.data;
}

export async function placeSpotOcoOrder(apiBase, payload) {
  const response = await api.post(`${apiBase}/spot/oco`, payload);
  return response.data;
}

export async function cancelSpotOcoOrder(apiBase, orderId) {
  return api.delete(`${apiBase}/spot/oco/${orderId}`);
}