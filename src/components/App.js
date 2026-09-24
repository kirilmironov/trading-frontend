import React, { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';
import Auth from './Auth';
import PriceChart from './PriceChart';
import OrderForm from './OrderForm';
import LiveMarket from './LiveMarket';
import Portfolio from './Portfolio';
import OrderHistory from './OrderHistory';
import PositionsTable from './PositionsTable';
import '../App.css';

const API_BASE = window.location.hostname === 'localhost'
  ? (process.env.REACT_APP_API_BASE || 'http://localhost:8080/api')
  : 'https://trading-backend-5s2w.onrender.com/api';

const WS_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8080/ws-trading'
  : 'https://trading-backend-5s2w.onrender.com/ws-trading';

export default function App() {
  const [user, setUser] = useState(null);
  const [stocks, setStocks] = useState({});
  const [orders, setOrders] = useState([]);
  const [positions, setPositions] = useState([]);
  const [selectedStock, setSelectedStock] = useState('BTCUSDC');
  const [notification, setNotification] = useState('');
  const [balance, setBalance] = useState(0);

  const userRef = useRef(user);
  useEffect(() => { 
    userRef.current = user; 
  }, [user]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // 1. Вземане на баланса строго по userId
  const fetchUserData = () => {
    const currentUser = userRef.current;
    if (!currentUser?.id) return;
    axios.get(`${API_BASE}/users/balance?userId=${currentUser.id}`)
      .then((res) => {
        if (res.data?.balance !== undefined) {
          setBalance(res.data.balance);
          localStorage.setItem('user', JSON.stringify({ ...currentUser, balance: res.data.balance }));
        }
      })
      .catch((err) => console.error('Error fetching user data:', err));
  };

  // 2. Вземане на история на поръчките строго по userId
  const fetchOrders = () => {
    const currentUser = userRef.current;
    if (!currentUser?.id) return;

    axios.get(`${API_BASE}/orders/user/${currentUser.id}`)
      .then((res) => setOrders(res.data.reverse()))
      .catch((err) => console.error('Error fetching orders:', err));
  };

  // 3. Вземане на отворените позиции строго по userId
  const fetchPositions = () => {
    const currentUser = userRef.current;
    if (!currentUser?.id) return;
    
    axios.get(`${API_BASE}/positions/open?userId=${currentUser.id}`)
      .then((res) => setPositions(res.data))
      .catch((err) => console.error('Error fetching positions:', err));
  };

  useEffect(() => {
    if (!user?.id) return;
    fetchUserData();
    fetchOrders();
    fetchPositions();

    axios.get(`${API_BASE}/stocks`)
      .then((res) => {
        const initialMap = {};
        res.data.forEach((s) => (initialMap[s.symbol] = s));
        setStocks(initialMap);
      })
      .catch((err) => console.error('Error fetching stocks:', err));
  }, [user]);

  // 4. WebSocket абонаменти строго по userId
  useEffect(() => {
    if (!user?.id) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 3000,
      debug: () => {},
      onConnect: () => {
        client.subscribe('/topic/ticks', (msg) => {
          if (!msg.body) return;
          const updatedStock = JSON.parse(msg.body);
          setStocks((prev) => ({ ...prev, [updatedStock.symbol]: updatedStock }));
        });

        client.subscribe('/topic/orders', (msg) => {
          if (!msg.body) return;
          const newOrder = JSON.parse(msg.body);
          if (newOrder.user?.id === userRef.current?.id) {
            fetchOrders();
            fetchUserData();
            fetchPositions();
          }
        });

        client.subscribe(`/topic/user/${user.id}/balance`, (msg) => {
          if (!msg.body) return;
          const data = JSON.parse(msg.body);
          if (data.balance !== undefined) {
            setBalance(data.balance);
          }
        });
      },
    });

    client.activate();
    return () => { 
      if (client.active) {
        client.deactivate(); 
      }
    };
  }, [user]);

  // 5. Депозит строго по userId
  const handleDeposit = () => {
    const amountStr = prompt('Enter deposit amount ($):', '1000');
    if (!amountStr) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }

    axios.post(`${API_BASE}/users/deposit?userId=${user.id}&amount=${amount}`)
      .then((res) => {
        triggerNotification(res.data.message || `Successfully deposited $${amount.toFixed(2)}`);
      })
      .catch((err) => {
        const errMsg = err.response?.data?.message || err.response?.data || 'Deposit failed';
        alert(errMsg);
      });
  };

  const handleCancelOrder = (orderId) => {
    axios
      .delete(`${API_BASE}/orders/${orderId}`)
      .then(() => {
        triggerNotification(`Order #${orderId} cancelled successfully.`);
      })
      .catch((err) => {
        const errMsg = err.response?.data?.message || err.response?.data || 'Error cancelling order';
        alert(errMsg);
      });
  };

  const handleClosePosition = (positionId, markPrice) => {
    axios
      .post(`${API_BASE}/positions/close/${positionId}?currentPrice=${markPrice}`)
      .then(() => {
        triggerNotification(`Position #${positionId} closed successfully.`);
        fetchPositions();
        fetchUserData();
      })
      .catch((err) => {
        const errMsg = err.response?.data?.message || err.response?.data || 'Error closing position';
        alert(errMsg);
      });
  };

  const triggerNotification = (msg) => {
    setNotification(msg);
    fetchUserData();
    fetchOrders();
    fetchPositions();
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
          <div style={styles.balanceCard}>
            <span style={{ fontSize: '11px', color: '#848e9c', fontWeight: '600' }}>BALANCE</span>
            <span style={{ fontSize: '17px', fontWeight: '700', color: '#f0b90b' }}>
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <button onClick={handleDeposit} style={styles.depositBtn}>
            + Deposit
          </button>

          <button onClick={() => { localStorage.removeItem('user'); setUser(null); }} style={styles.logoutBtn}>
            Log Out
          </button>
        </div>
      </header>

      {/* Notification Banner */}
      {notification && <div style={styles.notificationBanner}>✅ {notification}</div>}

      {/* Dashboard Grid */}
      <div style={styles.dashboardGrid}>
        
        {/* Лява колона */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Portfolio разчита САМО на отворените позиции */}
          <Portfolio positions={positions} stocks={stocks} />

          <div style={styles.card}>
            <PriceChart symbol={selectedStock} currentPrice={stocks[selectedStock]?.price || 0} />
          </div>

          <OrderForm 
            stocks={stocks} 
            selectedStock={selectedStock} 
            setSelectedStock={setSelectedStock} 
            userId={user.id} 
            API_BASE={API_BASE} 
            onSuccess={triggerNotification} 
          />
        </div>

        {/* Дясна колона */}
        <LiveMarket stocks={stocks} onSelectSymbol={(sym) => setSelectedStock(sym)} />
      </div>

      {/* Отворени позиции */}
      <div style={{ marginTop: '20px' }}>
        <PositionsTable 
          positions={positions} 
          stocks={stocks} 
          onClosePosition={handleClosePosition} 
        />
      </div>

      {/* История на поръчките */}
      <div style={{ marginTop: '20px' }}>
        <OrderHistory orders={orders} onCancelOrder={handleCancelOrder} />
      </div>

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
  dashboardGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
    gap: '20px' 
  },
  card: { 
    backgroundColor: '#1e2329', 
    borderRadius: '12px', 
    padding: '16px', 
    border: '1px solid #2b313a' 
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