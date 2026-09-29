import React from 'react';
import LiveMarket from '../../components/LiveMarket';
import PriceChart from '../../components/PriceChart';

export default function FuturesTradingPage({ futures, onSelectSymbol, onSuccess }) {
  const marketPrice = parseFloat(futures.stocks[futures.selectedStock]?.price || 0);

  return (
    <>
      <div style={styles.dashboardGrid}>
        <div style={styles.leftColumn}>
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.title}>Futures</h2>
            </div>
            <div style={styles.wallet}>Futures wallet: ${Number(futures.walletBalance).toFixed(2)}</div>
            <div style={styles.walletActions}>
              <button type="button" onClick={() => transfer(futures, 'SPOT_TO_FUTURES')} style={styles.walletButton}>Transfer from Spot</button>
              <button type="button" onClick={() => transfer(futures, 'FUTURES_TO_SPOT')} style={styles.walletButton}>Transfer to Spot</button>
            </div>
          </div>

          <div style={styles.chartFrame}>
            <PriceChart symbol={futures.selectedStock} currentPrice={marketPrice} />
          </div>

          <div style={styles.panel}>
            <h2 style={styles.title}>Futures Order</h2>
            <div style={styles.grid}>
              <label style={{ ...styles.field, gridColumn: '1 / -1' }}>
                Select Asset
                <select value={futures.selectedStock} onChange={(event) => futures.setSelectedStock(event.target.value)} style={styles.input}>
                  {Object.keys(futures.stocks).sort((left, right) => left.localeCompare(right)).map((symbol) => (
                    <option key={symbol} value={symbol}>
                      {symbol} (${Number(futures.stocks[symbol].price || 0).toFixed(2)})
                    </option>
                  ))}
                </select>
              </label>
              <label style={styles.field}>
                Position
                <select value={futures.side} onChange={(event) => futures.setSide(event.target.value)} style={styles.input}>
                  <option value="LONG">LONG</option>
                  <option value="SHORT">SHORT</option>
                </select>
              </label>
              <label style={styles.field}>
                Leverage
                <select value={futures.leverage} onChange={(event) => futures.changeLeverage(Number(event.target.value)).catch((error) => window.alert(error.response?.data?.message || 'Leverage change failed'))} style={styles.input}>
                  {[1, 2, 3, 5, 10, 20].map((value) => <option key={value} value={value}>{value}x</option>)}
                </select>
              </label>
              <label style={styles.field}>
                Order type
                <select value={futures.orderType} onChange={(event) => futures.setOrderType(event.target.value)} style={styles.input}>
                  <option value="MARKET">MARKET</option>
                  <option value="LIMIT">LIMIT</option>
                </select>
              </label>
              <label style={styles.field}>
                Quantity
                <input type="number" min="0.0001" step="any" value={futures.quantity} onChange={(event) => futures.setQuantity(event.target.value)} style={styles.input} />
              </label>
              {futures.orderType === 'LIMIT' && (
                <label style={styles.field}>
                  Limit price
                  <input type="number" min="0.01" step="any" value={futures.targetPrice} onChange={(event) => futures.setTargetPrice(event.target.value)} style={styles.input} />
                </label>
              )}
            </div>
            <button
              type="button"
              disabled={futures.orderType === 'LIMIT' && (!Number.isFinite(Number(futures.targetPrice)) || Number(futures.targetPrice) <= 0)}
              onClick={() => futures.placeOrder().then(() => onSuccess?.(`Opened ${futures.side} Futures position`)).catch((error) => alert(error.response?.data?.message || 'Futures order failed'))}
              style={styles.actionButton}
            >
              {futures.orderType === 'MARKET' ? 'Open Futures Position' : 'Place Futures Limit Order'}
            </button>
          </div>

          <div style={styles.panel}>
            <h2 style={styles.title}>Pending Futures Orders</h2>
            {futures.orders.filter((order) => order.status === 'PENDING').length === 0 ? (
              <p style={styles.description}>No pending Futures orders.</p>
            ) : futures.orders.filter((order) => order.status === 'PENDING').map((order) => (
              <div key={order.id} style={styles.positionRow}>
                <div>
                  <strong>{order.symbol} {order.positionSide} LIMIT</strong>
                  <div style={styles.positionMeta}>{order.quantity} @ ${Number(order.targetPrice).toFixed(2)} · {order.leverage}x</div>
                </div>
                <button type="button" onClick={() => futures.cancelOrder(order.id).catch((error) => window.alert(error.response?.data?.message || 'Cancel failed'))} style={styles.closeButton}>Cancel</button>
              </div>
            ))}
          </div>

          <div style={styles.panel}>
            <h2 style={styles.title}>Open Futures Positions</h2>
            {futures.positions.length === 0 ? (
              <p style={styles.description}>No open Futures positions.</p>
            ) : futures.positions.map((position) => (
              <div key={position.id} style={styles.positionRow}>
                <div>
                  <strong>{position.symbol} {position.positionSide}</strong>
                  <div style={styles.positionMeta}>{position.quantity} @ ${Number(position.entryPrice).toFixed(2)} · {position.leverage}x</div>
                  <div style={{ color: livePnl(position, futures.stocks) >= 0 ? '#0ecb81' : '#f6465d' }}>
                    PnL: ${livePnl(position, futures.stocks).toFixed(2)}
                  </div>
                </div>
                <button type="button" onClick={() => futures.closePosition(position.id)} style={styles.closeButton}>Close</button>
              </div>
            ))}
          </div>
        </div>

        <LiveMarket stocks={futures.stocks} onSelectSymbol={onSelectSymbol} />
      </div>
    </>
  );
}

const styles = {
  dashboardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' },
  leftColumn: { display: 'flex', flexDirection: 'column', gap: '20px' },
  panel: { backgroundColor: '#1e2329', borderRadius: '12px', padding: '20px', border: '1px solid #2b313a' },
  chartFrame: { backgroundColor: '#1e2329', borderRadius: '12px', padding: '16px', border: '1px solid #2b313a' },
  panelHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' },
  title: { margin: 0, color: '#eaecef', fontSize: '18px' },
  badge: { color: '#f0b90b', fontSize: '11px', fontWeight: '700' },
  description: { color: '#848e9c', fontSize: '14px', lineHeight: 1.5 },
  status: { color: '#f0b90b', backgroundColor: '#f0b90b18', border: '1px solid #f0b90b66', padding: '10px 12px', borderRadius: '8px', fontSize: '13px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginTop: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px', color: '#848e9c', fontSize: '12px', fontWeight: '600' },
  input: { width: '100%', boxSizing: 'border-box', backgroundColor: '#121214', border: '1px solid #2b313a', borderRadius: '8px', color: '#eaecef', padding: '10px', fontSize: '14px' },
  disabledButton: { width: '100%', marginTop: '16px', padding: '11px', border: 'none', borderRadius: '8px', backgroundColor: '#2b313a', color: '#848e9c', fontWeight: '700', cursor: 'not-allowed' },
  actionButton: { width: '100%', marginTop: '16px', padding: '11px', border: 'none', borderRadius: '8px', backgroundColor: '#f0b90b', color: '#121214', fontWeight: '700', cursor: 'pointer' },
  positionRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '14px 0', borderTop: '1px solid #2b313a', color: '#eaecef' },
  positionMeta: { color: '#848e9c', fontSize: '12px', margin: '6px 0' },
  closeButton: { border: '1px solid #f6465d', borderRadius: '6px', padding: '7px 12px', backgroundColor: 'transparent', color: '#f6465d', cursor: 'pointer', fontWeight: '700' },
  wallet: { marginTop: '14px', color: '#0ecb81', fontWeight: '700' },
  walletActions: { display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' },
  walletButton: { border: '1px solid #2b313a', borderRadius: '6px', padding: '8px 10px', backgroundColor: '#121214', color: '#eaecef', cursor: 'pointer', fontSize: '12px' },
};

function transfer(futures, direction) {
  const amount = Number(window.prompt('Transfer amount:', '100'));
  if (!Number.isFinite(amount) || amount <= 0) return;
  futures.transferWallet(direction, amount).catch((error) => window.alert(error.response?.data?.message || 'Wallet transfer failed'));
}

function livePnl(position, stocks) {
  const currentPrice = Number(stocks[position.symbol]?.price || position.entryPrice || 0);
  const direction = position.positionSide === 'LONG' ? 1 : -1;
  return (currentPrice - Number(position.entryPrice)) * Number(position.quantity) * direction;
}
