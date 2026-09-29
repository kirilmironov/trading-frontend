import { useCallback, useEffect, useState } from 'react';
import { cancelFuturesOrder, changeFuturesLeverage, closeFuturesPosition, fetchFuturesOrders, fetchFuturesPositions, fetchFuturesWallet, placeFuturesOrder, transferFuturesWallet } from './futuresApi';

export default function useFuturesTrading({ userId, apiBase, stocks = {}, onWalletChanged }) {
  const [selectedStock, setSelectedStock] = useState('BTCUSDC');
  const [side, setSide] = useState('LONG');
  const [leverage, setLeverage] = useState(1);
  const [orderType, setOrderType] = useState('MARKET');
  const [quantity, setQuantity] = useState('1');
  const [targetPrice, setTargetPrice] = useState('');
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);

  const refreshPositions = useCallback(async () => {
    if (!userId) return;
    const [positionData, wallet, orderData] = await Promise.all([
      fetchFuturesPositions(apiBase),
      fetchFuturesWallet(apiBase),
      fetchFuturesOrders(apiBase),
    ]);
    setPositions(positionData);
    setOrders(orderData);
    setWalletBalance(wallet.availableBalance);
    if (positionData.length > 0) setLeverage(positionData[0].leverage);
  }, [apiBase, userId]);

  const placeOrder = useCallback(async () => {
    const order = await placeFuturesOrder(apiBase, {
      symbol: selectedStock,
      quantity: Number(quantity),
      side: side === 'LONG' ? 'BUY' : 'SELL',
      positionSide: side,
      orderType,
      leverage,
      targetPrice: orderType === 'LIMIT' ? Number(targetPrice) : null,
    });
    await refreshPositions();
    return order;
  }, [apiBase, leverage, orderType, quantity, refreshPositions, selectedStock, side, targetPrice]);

  const closePosition = useCallback(async (positionId) => {
    await closeFuturesPosition(apiBase, positionId);
    await refreshPositions();
  }, [apiBase, refreshPositions]);

  const cancelOrder = useCallback(async (orderId) => {
    await cancelFuturesOrder(apiBase, orderId);
    await refreshPositions();
  }, [apiBase, refreshPositions]);

  const transferWallet = useCallback(async (direction, amount) => {
    await transferFuturesWallet(apiBase, direction, amount);
    await refreshPositions();
    await onWalletChanged?.();
  }, [apiBase, onWalletChanged, refreshPositions]);

  const changeLeverage = useCallback(async (nextLeverage) => {
    await changeFuturesLeverage(apiBase, selectedStock, nextLeverage);
    setLeverage(nextLeverage);
    await refreshPositions();
  }, [apiBase, refreshPositions, selectedStock]);

  useEffect(() => {
    if (!userId) return undefined;
    const intervalId = window.setInterval(() => {
      refreshPositions().catch((error) => console.error('Error refreshing Futures data:', error));
    }, 3000);
    return () => window.clearInterval(intervalId);
  }, [refreshPositions, userId]);

  useEffect(() => {
    refreshPositions().catch((error) => console.error('Error fetching Futures positions:', error));
  }, [refreshPositions]);

  return {
    stocks,
    selectedStock,
    setSelectedStock,
    side,
    setSide,
    leverage,
    setLeverage,
    orderType,
    setOrderType,
    quantity,
    setQuantity,
    targetPrice,
    setTargetPrice,
    positions,
    orders,
    placeOrder,
    closePosition,
    cancelOrder,
    walletBalance,
    transferWallet,
    changeLeverage,
  };
}
