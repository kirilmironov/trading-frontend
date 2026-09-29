import React, { useEffect, useState } from 'react';
import api, { loadCsrfToken } from '../api';
import Auth from './Auth';
import SpotTradingPage from '../features/spot/SpotTradingPage';
import useSpotTrading from '../features/spot/useSpotTrading';
import FuturesTradingPage from '../features/futures/FuturesTradingPage';
import useFuturesTrading from '../features/futures/useFuturesTrading';
import '../App.css';

const API_BASE = window.location.hostname === 'localhost'
  ? (process.env.REACT_APP_API_BASE || 'http://localhost:8080/api')
  : 'https://trading-backend-5s2w.onrender.com/api';

const WS_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8080/ws-trading'
  : 'https://trading-backend-5s2w.onrender.com/ws-trading';

export default function App() {
  const [user, setUser] = useState(null);
  const [notification, setNotification] = useState('');
  const [marketMode, setMarketMode] = useState('SPOT');
  const spot = useSpotTrading({ userId: user?.id, apiBase: API_BASE, websocketUrl: WS_URL });
  const futures = useFuturesTrading({ userId: user?.id, apiBase: API_BASE, stocks: spot.stocks, onWalletChanged: spot.refreshSpotData });

  useEffect(() => {
    let active = true;
    loadCsrfToken(API_BASE)
      .then(() => api.get(`${API_BASE}/auth/me`))
      .then((response) => {
        if (!active) return;
        localStorage.setItem('user', JSON.stringify(response.data));
        setUser(response.data);
      })
      .catch(() => {
        localStorage.removeItem('user');
      });

    return () => { active = false; };
  }, []);

  const handleDeposit = () => {
    const amountStr = prompt('Enter deposit amount ($):', '1000');
    if (!amountStr) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }

    spot.deposit(amount)
      .then((res) => {
        triggerNotification(res.message || `Successfully deposited $${amount.toFixed(2)}`);
      })
      .catch((err) => {
        const errMsg = err.response?.data?.message || err.response?.data || 'Deposit failed';
        alert(errMsg);
      });
  };

  const handleCancelOrder = (orderId) => {
    spot.cancelOrder(orderId)
      .then(() => {
        triggerNotification(`Order #${orderId} cancelled successfully.`);
      })
      .catch((err) => {
        const errMsg = err.response?.data?.message || err.response?.data || 'Error cancelling order';
        alert(errMsg);
      });
  };

  const triggerNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  if (!user) return <Auth onLoginSuccess={(u) => setUser(u)} />;

  return (
    <div style={styles.mainWrapper}>
      {/* Header */}
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={styles.logoBadge}>⚡</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>CryptoTrader Pro</h1>
            <span style={{ fontSize: '12px', color: '#848e9c' }}>User: <strong style={{ color: '#eaecef' }}>{user.username}</strong></span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
          <div style={styles.marketModes} aria-label="Market mode">
            {['SPOT', 'FUTURES'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setMarketMode(mode)}
                aria-pressed={marketMode === mode}
                style={{ ...styles.modeButton, ...(marketMode === mode ? styles.modeButtonActive : {}) }}
              >
                {mode}
              </button>
            ))}
          </div>

          <div style={styles.balanceCard}>
            <span style={{ fontSize: '11px', color: '#848e9c', fontWeight: '600' }}>SPOT BALANCE</span>
            <span style={{ fontSize: '17px', fontWeight: '700', color: '#f0b90b' }}>
              ${spot.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <button onClick={handleDeposit} style={styles.depositBtn}>
            + Deposit
          </button>

          <button onClick={() => {
            api.post(`${API_BASE}/auth/logout`)
              .finally(() => {
                localStorage.removeItem('user');
                setUser(null);
              });
          }} style={styles.logoutBtn}>
            Log Out
          </button>
        </div>
      </header>

      {/* Notification Banner */}
      {notification && <div style={styles.notificationBanner}>✅ {notification}</div>}

      {marketMode === 'SPOT' ? (
        <SpotTradingPage
          stocks={spot.stocks}
          orders={spot.orders}
          ocoOrders={spot.ocoOrders}
          positions={spot.positions}
          selectedStock={spot.selectedStock}
          setSelectedStock={spot.setSelectedStock}
          onPlaceOrder={spot.placeOrder}
          onPlaceOcoOrder={spot.placeOcoOrder}
          onCancelOrder={handleCancelOrder}
          onCancelOcoOrder={spot.cancelOcoOrder}
          onSuccess={triggerNotification}
        />
      ) : (
        <FuturesTradingPage futures={futures} onSelectSymbol={futures.setSelectedStock} onSuccess={triggerNotification} />
      )}

    </div>
  );
}

const styles = {
  mainWrapper: { 
    backgroundColor: '#121214', 
    color: '#eaecef', 
    minHeight: '100vh', 
    padding: '16px', 
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
  },
  header: { 
    display: 'flex', 
    alignItems: 'center', 
    backgroundColor: '#1e2329', 
    padding: '12px 16px', 
    borderRadius: '12px', 
    marginBottom: '20px', 
    border: '1px solid #2b313a' 
  },
  marketModes: {
    display: 'flex',
    gap: '4px',
    padding: '4px',
    backgroundColor: '#121214',
    border: '1px solid #2b313a',
    borderRadius: '8px',
  },
  modeButton: {
    width: '88px',
    height: '34px',
    border: 'none',
    borderRadius: '6px',
    padding: '0',
    backgroundColor: 'transparent',
    color: '#848e9c',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  modeButtonActive: {
    backgroundColor: '#f0b90b',
    color: '#121214',
  },
  logoBadge: { 
    width: '36px', 
    height: '36px', 
    backgroundColor: '#f0b90b', 
    color: '#121214', 
    borderRadius: '8px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontSize: '18px', 
    fontWeight: 'bold' 
  },
  balanceCard: { 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'flex-end', 
    backgroundColor: '#2b313a', 
    padding: '6px 12px', 
    borderRadius: '8px' 
  },
  depositBtn: {
    backgroundColor: '#0ecb81',
    color: '#ffffff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '8px',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'opacity 0.2s'
  },
  logoutBtn: { 
    backgroundColor: 'transparent', 
    color: '#f6465d', 
    border: '1px solid #f6465d', 
    padding: '8px 14px', 
    borderRadius: '8px', 
    fontWeight: '600', 
    cursor: 'pointer' 
  },
  notificationBanner: { 
    backgroundColor: '#0ecb8122', 
    color: '#0ecb81', 
    border: '1px solid #0ecb81', 
    padding: '12px 16px', 
    borderRadius: '10px', 
    marginBottom: '20px', 
    fontWeight: '600' 
  }
};