import React from 'react';

export default function OrderHistory({ orders, onCancelOrder }) {
  return (
    <div style={styles.card}>
      <h3 style={styles.title}>📜 Order History & Pending Orders</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>SIDE</th>
              <th style={styles.th}>TYPE</th>
              <th style={styles.th}>SYMBOL</th>
              <th style={styles.th}>QTY</th>
              <th style={styles.th}>PRICE / TARGET</th>
              <th style={styles.th}>STATUS</th>
              <th style={styles.th}>DATE & TIME</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {orders && orders.length > 0 ? (
              orders.map((o) => {
                const isBuy = o.side === 'BUY';
                const isPending = o.status === 'PENDING';

                // Определяне на текста за цена спрямо това дали е изпълнена, или е чакаща (Pending)
                let priceDisplay = '—';
                if (o.status === 'EXECUTED' && o.price) {
                  priceDisplay = `$${Number(o.price).toFixed(2)}`;
                } else if (o.targetPrice) {
                  priceDisplay = `Target: $${Number(o.targetPrice).toFixed(2)}`;
                } else if (o.orderType === 'MARKET') {
                  priceDisplay = 'MARKET';
                }

                // Форматиране на датата
                const formattedDate = o.timestamp 
                  ? new Date(o.timestamp).toLocaleString() 
                  : (o.createdAt ? new Date(o.createdAt).toLocaleString() : '—');

                return (
                  <tr key={o.id} style={styles.tr}>
                    <td style={styles.td}>#{o.id}</td>
                    
                    {/* SIDE (BUY / SELL) */}
                    <td style={styles.td}>
                      <span style={isBuy ? styles.badgeBuy : styles.badgeSell}>
                        {o.side}
                      </span>
                    </td>

                    {/* TYPE (LIMIT, MARKET, STOP_LOSS, TAKE_PROFIT) */}
                    <td style={styles.tdType}>{o.orderType || 'MARKET'}</td>

                    <td style={styles.td}>{o.symbol}</td>
                    <td style={styles.td}>{o.quantity}</td>
                    <td style={styles.td}>{priceDisplay}</td>

                    {/* STATUS */}
                    <td style={styles.td}>
                      <span style={getStatusStyle(o.status)}>
                        {o.status}
                      </span>
                    </td>

                    {/* DATE & TIME */}
                    <td style={styles.tdTime}>{formattedDate}</td>

                    {/* ACTION (Cancel button for PENDING) */}
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      {isPending ? (
                        <button 
                          onClick={() => onCancelOrder(o.id)} 
                          style={styles.cancelBtn}
                        >
                          Cancel
                        </button>
                      ) : (
                        <span style={{ color: '#474d57' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" style={{ ...styles.td, textAlign: 'center', color: '#848e9c', padding: '24px' }}>
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Помощна функция за стила на статусите
function getStatusStyle(status) {
  const base = {
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '700',
    display: 'inline-block'
  };

  switch (status) {
    case 'EXECUTED':
      return { ...base, backgroundColor: 'rgba(14, 203, 129, 0.15)', color: '#0ecb81' };
    case 'CANCELLED':
    case 'CANCELED':
      return { ...base, backgroundColor: 'rgba(132, 142, 156, 0.15)', color: '#848e9c' };
    case 'PENDING':
      return { ...base, backgroundColor: 'rgba(240, 185, 11, 0.15)', color: '#f0b90b' };
    default:
      return { ...base, backgroundColor: '#2b313a', color: '#eaecef' };
  }
}

const styles = {
  card: { backgroundColor: '#1e2329', borderRadius: '16px', padding: '24px', border: '1px solid #2b313a', marginTop: '20px' },
  title: { margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#eaecef' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  thRow: { borderBottom: '1px solid #2b313a' },
  th: { padding: '12px 10px', color: '#848e9c', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #2b313a' },
  td: { padding: '12px 10px', fontSize: '13px', color: '#eaecef' },
  tdType: { padding: '12px 10px', fontSize: '13px', color: '#848e9c', fontWeight: '500' },
  tdTime: { padding: '12px 10px', fontSize: '12px', color: '#848e9c' },
  badgeBuy: { backgroundColor: 'rgba(14, 203, 129, 0.15)', color: '#0ecb81', padding: '3px 8px', borderRadius: '4px', fontWeight: '700', fontSize: '11px' },
  badgeSell: { backgroundColor: 'rgba(246, 70, 93, 0.15)', color: '#f6465d', padding: '3px 8px', borderRadius: '4px', fontWeight: '700', fontSize: '11px' },
  cancelBtn: { backgroundColor: '#f6465d', color: '#ffffff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }
};