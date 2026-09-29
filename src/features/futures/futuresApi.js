import api from '../../api';

export async function fetchFuturesPositions(apiBase) {
  const response = await api.get(`${apiBase}/futures/positions/open`);
  return response.data;
}

export async function fetchFuturesOrders(apiBase) {
  const response = await api.get(`${apiBase}/futures/orders`);
  return response.data;
}

export async function fetchFuturesWallet(apiBase) {
  const response = await api.get(`${apiBase}/futures/wallet`);
  return response.data;
}

export async function transferFuturesWallet(apiBase, direction, amount) {
  const response = await api.post(`${apiBase}/futures/wallet/transfer?direction=${direction}&amount=${amount}`);
  return response.data;
}

export async function changeFuturesLeverage(apiBase, symbol, leverage) {
  const response = await api.post(`${apiBase}/futures/leverage?symbol=${symbol}&leverage=${leverage}`);
  return response.data;
}

export async function placeFuturesOrder(apiBase, payload) {
  const response = await api.post(`${apiBase}/futures/orders`, payload);
  return response.data;
}

export async function closeFuturesPosition(apiBase, positionId) {
  return api.post(`${apiBase}/futures/positions/close/${positionId}`);
}

export async function cancelFuturesOrder(apiBase, orderId) {
  return api.delete(`${apiBase}/futures/orders/${orderId}`);
}
