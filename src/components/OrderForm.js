import React, { useState } from 'react';
import axios from 'axios';

const DEFAULT_API_BASE = window.location.hostname === 'localhost'
  ? (process.env.REACT_APP_API_BASE || 'http://localhost:8080/api')
  : 'https://trading-backend-5s2w.onrender.com/api';

export default function OrderForm({ 
  stocks = {}, 
  selectedStock, 
  setSelectedStock, 
  username, 
  userId, 
  API_BASE = DEFAULT_API_BASE, 
  onSuccess 
}) {
  const [quantity, setQuantity] = useState('1');
  const [orderType, setOrderType] = useState('MARKET');
  const [targetPrice, setTargetPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const currentStock = stocks[selectedStock];
  const marketPrice = currentStock ? parseFloat(currentStock.price) : 0;

  const handleOrder = (side) => {
    const qty = parseFloat(quantity);

    if (!selectedStock || !stocks[selectedStock]) {
      alert('Please select a valid stock.');
      return;
    }

    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid quantity greater than 0.');
      return;
    }

    const cleanTargetPrice = targetPrice
      ? parseFloat(targetPrice.toString().replace(',', '.'))
      : null;

    if (orderType !== 'MARKET' && (!cleanTargetPrice || isNaN(cleanTargetPrice) || cleanTargetPrice <= 0)) {
      alert('Please specify a valid Target Price for Limit/Stop/Take-Profit orders.');
      return;
    }

    setLoading(true);

    const payload = {
      symbol: selectedStock,
      quantity: qty,
      side: side,                 // BUY / SELL
      type: orderType,            // MARKET, LIMIT, STOP_LOSS, TAKE_PROFIT
      orderType: orderType,       // Дублиране за съвместимост
      price: orderType === 'MARKET' ? null : cleanTargetPrice,
      targetPrice: orderType === 'MARKET' ? null : cleanTargetPrice,
    };

    const userParam = userId ? `userId=${userId}` : `username=${username}`;

    axios
      .post(`${API_BASE}/orders?${userParam}`, payload)
      .then((res) => {
        const createdOrder = res.data;
        const executedPrice = createdOrder.price ? `$${parseFloat(createdOrder.price).toFixed(2)}` : '';

        const msg = createdOrder.status === 'EXECUTED'
          ? `Executed ${side} ${qty} x ${selectedStock} @ ${executedPrice}`
          : `Created ${orderType} ${side} order for ${qty} x ${selectedStock}`;

        if (onSuccess) onSuccess(msg);
        
        setQuantity('1');
        setTargetPrice('');
      })
      .catch((err) => {
        console.error('Backend Error Details:', err.response?.data);
        const errMsg = err.response?.data?.message || 
                       (typeof err.response?.data === 'string' ? err.response.data : null) || 
                       'Error creating order (Status 400 Bad Request)';
        alert(errMsg);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const isProtectionOrder = orderType === 'STOP_LOSS' || orderType === 'TAKE_PROFIT';

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>⚡ Place Order</h3>

      {/* Селектор за Актив */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Select Asset</label>
        <select
          value={selectedStock}
          onChange={(e) => setSelectedStock(e.target.value)}
          style={styles.select}
        >
          {Object.keys(stocks).map((sym) => (
            <option key={sym} value={sym}>
              {sym} (${parseFloat(stocks[sym].price || 0).toFixed(2)})
            </option>
          ))}
        </select>
      </div>

      {/* Избор на тип поръчка */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Order Type</label>
        <div style={styles.typeGrid}>
          {['MARKET', 'LIMIT', 'STOP_LOSS', 'TAKE_PROFIT'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setOrderType(t)}
              style={{
                ...styles.typeBtn,
                backgroundColor: orderType === t ? '#f0b90b' : '#2b313a',
                color: orderType === t ? '#000000' : '#eaecef',
              }}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Количество */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Quantity</label>
        <input
          type="number"
          min="0.0001"
          step="any"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="0.00"
          style={styles.input}
        />
      </div>

      {/* Целева цена */}
      {orderType !== 'MARKET' && (
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Target Price ($)</label>
          <input
            type="number"
            min="0.01"
            step="any"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            placeholder={`Current: $${marketPrice.toFixed(2)}`}
            style={styles.input}
          />
        </div>
      )}

      {/* Динамични бутони за изпращане */}
      <div style={{
        ...styles.btnRow,
        gridTemplateColumns: isProtectionOrder ? '1fr' : '1fr 1fr'
      }}>
        {!isProtectionOrder && (
          <button
            onClick={() => handleOrder('BUY')}
            disabled={loading}
            style={{ ...styles.actionBtn, backgroundColor: '#0ecb81' }}
          >
            {loading ? 'Processing...' : 'BUY'}
          </button>
        )}
        
        <button
          onClick={() => handleOrder('SELL')}
          disabled={loading}
          style={{ ...styles.actionBtn, backgroundColor: '#f6465d' }}
        >
          {loading ? 'Processing...' : (
            orderType === 'STOP_LOSS' ? 'SET STOP LOSS' :
            orderType === 'TAKE_PROFIT' ? 'SET TAKE PROFIT' : 'SELL'
          )}
        </button>
      </div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#1e2329',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #2b313a',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#eaecef',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    color: '#848e9c',
    fontWeight: '600',
  },
  select: {
    backgroundColor: '#121214',
    border: '1px solid #2b313a',
    borderRadius: '8px',
    color: '#eaecef',
    padding: '10px 12px',
    fontSize: '14px',
    outline: 'none',
  },
  typeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
  },
  typeBtn: {
    border: 'none',
    borderRadius: '6px',
    padding: '8px 4px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  input: {
    backgroundColor: '#121214',
    border: '1px solid #2b313a',
    borderRadius: '8px',
    color: '#eaecef',
    padding: '10px 12px',
    fontSize: '14px',
    outline: 'none',
  },
  btnRow: {
    display: 'grid',
    gap: '12px',
    marginTop: '8px',
  },
  actionBtn: {
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    padding: '12px',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
};