import React, { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import axios from 'axios';
import Auth from './Auth';
import PriceChart from './PriceChart';
import OrderForm from './OrderForm';
import LiveMarket from './LiveMarket';
import Portfolio from './Portfolio';
import OrderHistory from './OrderHistory';
import '../App.css';

// Използва променливите от .env файла за локална среда,
// а в Render (където няма .env) автоматично превключва към облачните адреси.
const API_BASE = process.env.REACT_APP_API_BASE || 'https://trading-backend-5s2w.onrender.com/api';
const WS_URL = process.env.REACT_APP_WS_URL || 'wss://trading-backend-5s2w.onrender.com/ws-trading/websocket';

export default function App() {
  const [user, setUser] = useState(null);
  const [stocks, setStocks] = useState({});
  const [orders, setOrders] = useState([]);
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

  const fetchUserData = () => {
    const currentUser = userRef.current;
    if (!currentUser?.username) return;
    axios.get(`${API_BASE}/auth/user/${currentUser.username}`)
      .then((res) => {
        if (res.data?.balance !== undefined) {
          setBalance(res.data.balance);
          localStorage.setItem('user', JSON.stringify({ ...currentUser, balance: res.data.balance }));
        }
      });
  };

  const fetchOrders = () => {
    const currentUser = userRef.current;
    if (!currentUser?.username) return;
    axios.get(`${API_BASE}/orders/${currentUser.username}`).then((res) => setOrders(res.data.reverse()));
  };

  useEffect(() => {
    if (!user) return;
    fetchUserData();
    fetchOrders();

    axios.get(`${API_BASE}/stocks`).then((res) => {
      const initialMap = {};
      res.data.forEach((s) => (initialMap[s.symbol] = s));
      setStocks(initialMap);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 3000,
      onConnect: () => {
        client.subscribe('/topic/ticks', (msg) => {
          if (!msg.body) return;
          const updatedStock = JSON.parse(msg.body);
          setStocks((prev) => ({ ...prev, [updatedStock.symbol]: updatedStock }));
        });

        client.subscribe('/topic/orders', (msg) => {
          if (!msg.body) return;
          const newOrder = JSON.parse(msg.body);
          if (newOrder.user?.username === userRef.current?.username) {
            fetchOrders();
            fetchUserData();
          }
        });
      },
    });

    client.activate();
    return () => { client.deactivate(); };
  }, [user]);

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

  const triggerNotification = (msg) => {
    setNotification(msg);
    fetchUserData();
    fetchOrders();
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={styles.balanceCard}>
            <span style={{ fontSize: '12px', color: '#848e9c', fontWeight: '600' }}>BALANCE</span>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#f0b90b' }}>
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Portfolio orders={orders} stocks={stocks} />

          <div style={styles.card}>
            <PriceChart symbol={selectedStock} currentPrice={stocks[selectedStock]?.price || 0} />
          </div>

          <OrderForm 
            stocks={stocks} 
            selectedStock={selectedStock} 
            setSelectedStock={setSelectedStock} 
            username={user.username} 
            API_BASE={API_BASE} 
            onSuccess={triggerNotification} 
          />
        </div>

        {/* Дясна колона */}
        <LiveMarket stocks={stocks} onSelectSymbol={(sym) => setSelectedStock(sym)} />
      </div>

      {/* Долна секция: История на поръчките */}
      <OrderHistory orders={orders} onCancelOrder={handleCancelOrder} />

    </div>
  );
}

const styles = {
  mainWrapper: { backgroundColor: '#121214', color: '#eaecef', minHeight: '100vh', padding: '24px 40px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e2329', padding: '16px 24px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #2b313a' },
  logoBadge: { width: '40px', height: '40px', backgroundColor: '#f0b90b', color: '#121214', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' },
  balanceCard: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', backgroundColor: '#2b313a', padding: '8px 16px', borderRadius: '10px' },
  logoutBtn: { backgroundColor: 'transparent', color: '#f6465d', border: '1px solid #f6465d', padding: '10px 18px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: '0.2s' },
  dashboardGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  card: { backgroundColor: '#1e2329', borderRadius: '12px', padding: '24px', border: '1px solid #2b313a' },
  notificationBanner: { backgroundColor: '#0ecb8122', color: '#0ecb81', border: '1px solid #0ecb81', padding: '14px 20px', borderRadius: '10px', marginBottom: '24px', fontWeight: '600' }
};