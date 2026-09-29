import React from 'react';

export default function SpotOcoOrders({ orders = [], onCancel }) {
  const pendingOrders = orders.filter((order) => order.status === 'PENDING');

  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>OCO Orders</h3>
      {pendingOrders.length === 0 ? (
        <p style={styles.empty}>No pending OCO orders.</p>
      ) : pendingOrders.map((order) => (
        <div key={order.id} style={styles.row}>
          <div>
            <strong>{order.symbol} OCO {order.side}</strong>
            <div style={styles.meta}>QTY {order.quantity} · {order.side === 'SELL' ? 'TP' : 'Buy Limit'} ${Number(order.takeProfitPrice).toFixed(4)}</div>
            <div style={styles.meta}>Stop ${Number(order.stopPrice).toFixed(4)} / Limit ${Number(order.stopLimitPrice).toFixed(4)}</div>
            {order.stopTriggered && <div style={styles.triggered}>Stop triggered; waiting for limit fill</div>}
          </div>
          <button type="button" onClick={() => onCancel(order.id)} style={styles.cancel}>Cancel OCO</button>
        </div>
      ))}
    </div>
  );
}

const styles = {
  panel: { marginTop: '20px', backgroundColor: '#1e2329', border: '1px solid #2b313a', borderRadius: '12px', padding: '20px' },
  title: { margin: '0 0 12px', color: '#eaecef', fontSize: '16px' },
  empty: { color: '#848e9c', fontSize: '13px' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', borderTop: '1px solid #2b313a', padding: '12px 0', color: '#eaecef' },
  meta: { color: '#848e9c', fontSize: '12px', marginTop: '5px' },
  triggered: { color: '#f0b90b', fontSize: '12px', marginTop: '5px' },
  cancel: { border: '1px solid #f6465d', borderRadius: '6px', padding: '7px 10px', color: '#f6465d', backgroundColor: 'transparent', cursor: 'pointer' },
};
