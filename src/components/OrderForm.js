import React, { useState } from 'react';
import axios from 'axios';

export default function OrderForm({ stocks, selectedStock, setSelectedStock, username, API_BASE, onSuccess }) {
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState('MARKET'); // MARKET, LIMIT, STOP_LOSS, TAKE_PROFIT
  const [targetPrice, setTargetPrice] = useState('');

  const isOnlySellOrder = orderType === 'STOP_LOSS' || orderType === 'TAKE_PROFIT';

  const handleOrder = (side) => {
    const stock = stocks[selectedStock];
    const qty = parseInt(quantity, 10);
    if (!stock || qty <= 0) return alert('Please enter valid quantity');

    const cleanTargetPrice = targetPrice
      ? parseFloat(targetPrice.toString().replace(',', '.'))
      : null;

    if (orderType !== 'MARKET' && (!cleanTargetPrice || cleanTargetPrice <= 0)) {
      alert('Please specify a valid Target Price for Limit/Stop/Take-Profit orders.');
      return;
    }

    const payload = {
      symbol: selectedStock,
      quantity: qty,
      side: side,
      orderType: orderType,
      targetPrice: orderType === 'MARKET' ? null : cleanTargetPrice,
    };

    axios
      .post(`${API_BASE}/orders?username=${username}`, payload)
      .then((res) => {
        const createdOrder = res.data;
        const msg = createdOrder.status === 'EXECUTED'
          ? `Executed ${side} ${qty} x ${selectedStock} @ $${createdOrder.price?.toFixed(2)}`
          : `Created ${orderType} ${side} order for ${qty} x ${selectedStock} @ $${cleanTargetPrice}`;

        onSuccess(msg);
        setQuantity(1);
        setTargetPrice('');
      })
      .catch((err) => {
        const errMsg = err.response?.data?.message || err.response?.data || 'Error creating order';
        alert(errMsg);
      });
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>⚡ Place Order</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Assets Dropdown */}
        <div>
          <label style={styles.label}>Select Asset</label>
          <select
            value={selectedStock}
            onChange={(e) => {
              const newSymbol = e.target.value;
              setSelectedStock(newSymbol);
              if (stocks[newSymbol]) setTargetPrice(stocks[newSymbol].price);
            }}
            style={styles.input}
          >
            {Object.keys(stocks)
              .sort((a, b) => a.localeCompare(b))
              .map((sym) => (
                <option key={sym} value={sym} style={{ backgroundColor: '#1e2329', color: '#eaecef' }}>
                  {sym} (${stocks[sym]?.price})
                </option>
              ))}
          </select>
        </div>

        {/* Order Type Dropdown */}
        <div>
          <label style={styles.label}>Order Type</label>
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            style={styles.input}
          >
            <option value="MARKET" style={{ backgroundColor: '#1e2329', color: '#eaecef' }}>Market (Instant Execution)</option>
            <option value="LIMIT" style={{ backgroundColor: '#1e2329', color: '#eaecef' }}>Limit Order</option>
            <option value="STOP_LOSS" style={{ backgroundColor: '#1e2329', color: '#eaecef' }}>Stop Loss</option>
            <option value="TAKE_PROFIT" style={{ backgroundColor: '#1e2329', color: '#eaecef' }}>Take Profit</option>
          </select>
        </div>

        {/* Target Price Input (Показва се за LIMIT, STOP_LOSS и TAKE_PROFIT) */}
        {orderType !== 'MARKET' && (
          <div>
            <label style={styles.label}>Target Price ($)</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder={`Current: $${stocks[selectedStock]?.price || 0}`}
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value.replace(',', '.'))}
              style={styles.input}
            />
          </div>
        )}

        {/* Quantity Input */}
        <div>
          <label style={styles.label}>Quantity</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={styles.input}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: isOnlySellOrder ? '1fr' : '1fr 1fr', gap: '12px', marginTop: '6px' }}>
          {!isOnlySellOrder && (
            <button onClick={() => handleOrder('BUY')} style={styles.buyBtn}>
              BUY ({orderType})
            </button>
          )}
          <button onClick={() => handleOrder('SELL')} style={styles.sellBtn}>
            SELL ({orderType})
          </button>
        </div>

      </div>
    </div>
  );
}

const styles = {
  card: { backgroundColor: '#1e2329', borderRadius: '16px', padding: '24px', border: '1px solid #2b313a' },
  title: { margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#eaecef' },
  label: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#848e9c', marginBottom: '6px' },
  input: { width: '100%', backgroundColor: '#121214', border: '1px solid #2b313a', color: '#eaecef', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  buyBtn: { backgroundColor: '#0ecb81', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' },
  sellBtn: { backgroundColor: '#f6465d', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }
};