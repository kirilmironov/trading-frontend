import { useCallback, useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {
  cancelSpotOrder,
  cancelSpotOcoOrder,
  depositToSpotAccount,
  fetchSpotBalance,
  fetchSpotOrders,
  fetchSpotOcoOrders,
  fetchSpotPositions,
  fetchSpotStocks,
  placeSpotOrder,
  placeSpotOcoOrder,
} from './spotApi';

export default function useSpotTrading({ userId, apiBase, websocketUrl }) {
  const [stocks, setStocks] = useState({});
  const [orders, setOrders] = useState([]);
  const [ocoOrders, setOcoOrders] = useState([]);
  const [positions, setPositions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [selectedStock, setSelectedStock] = useState('BTCUSDC');
  const [dataUserId, setDataUserId] = useState(null);

  const refreshSpotData = useCallback(async () => {
    const [stockData, orderData, ocoOrderData, positionData, accountBalance] = await Promise.all([
      fetchSpotStocks(apiBase),
      fetchSpotOrders(apiBase),
      fetchSpotOcoOrders(apiBase),
      fetchSpotPositions(apiBase),
      fetchSpotBalance(apiBase),
    ]);

    const stockMap = {};
    stockData.forEach((stock) => { stockMap[stock.symbol] = stock; });
    setStocks(stockMap);
    setOrders(orderData);
    setOcoOrders(ocoOrderData);
    setPositions(positionData);
    setBalance(accountBalance);
    setDataUserId(userId);
  }, [apiBase, userId]);

  const placeOrder = useCallback(async (payload) => {
    const order = await placeSpotOrder(apiBase, payload);
    await refreshSpotData();
    return order;
  }, [apiBase, refreshSpotData]);

  const placeOcoOrder = useCallback(async (payload) => {
    const order = await placeSpotOcoOrder(apiBase, payload);
    await refreshSpotData();
    return order;
  }, [apiBase, refreshSpotData]);

  const cancelOrder = useCallback(async (orderId) => {
    await cancelSpotOrder(apiBase, orderId);
    await refreshSpotData();
  }, [apiBase, refreshSpotData]);

  const cancelOcoOrder = useCallback(async (orderId) => {
    await cancelSpotOcoOrder(apiBase, orderId);
    await refreshSpotData();
  }, [apiBase, refreshSpotData]);

  const deposit = useCallback(async (amount) => {
    const result = await depositToSpotAccount(apiBase, amount);
    await refreshSpotData();
    return result;
  }, [apiBase, refreshSpotData]);

  useEffect(() => {
    if (!userId) return undefined;

    refreshSpotData().catch((error) => console.error('Error fetching Spot data:', error));

    const client = new Client({
      webSocketFactory: () => new SockJS(websocketUrl),
      reconnectDelay: 3000,
      debug: () => {},
      onConnect: () => {
        client.subscribe('/topic/ticks', (message) => {
          if (!message.body) return;
          const updatedStock = JSON.parse(message.body);
          setStocks((previous) => ({ ...previous, [updatedStock.symbol]: updatedStock }));
        });

        client.subscribe(`/topic/user/${userId}/orders`, (message) => {
          if (message.body) {
            refreshSpotData().catch((error) => console.error('Error refreshing Spot data:', error));
          }
        });

        client.subscribe(`/topic/user/${userId}/balance`, (message) => {
          if (!message.body) return;
          const update = JSON.parse(message.body);
          if (update.balance !== undefined) setBalance(update.balance);
        });
      },
    });

    client.activate();
    return () => {
      if (client.active) client.deactivate();
    };
  }, [userId, websocketUrl, refreshSpotData]);

  const hasCurrentUserData = userId != null && dataUserId === userId;

  return {
    stocks: hasCurrentUserData ? stocks : {},
    orders: hasCurrentUserData ? orders : [],
    ocoOrders: hasCurrentUserData ? ocoOrders : [],
    positions: hasCurrentUserData ? positions : [],
    balance: hasCurrentUserData ? balance : 0,
    selectedStock,
    setSelectedStock,
    placeOrder,
    placeOcoOrder,
    cancelOrder,
    cancelOcoOrder,
    deposit,
    refreshSpotData,
  };
}