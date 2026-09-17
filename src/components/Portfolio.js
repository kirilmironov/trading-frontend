import React from 'react';

export default function Portfolio({ orders, stocks }) {
  const calculatePortfolio = () => {
    const holdings = {};
    orders.forEach((order) => {
      if (order.status !== 'EXECUTED') return;
      const sym = order.symbol;
      const qty = parseFloat(order.quantity);
      if (!holdings[sym]) holdings[sym] = 0;
      if (order.type === 'BUY') holdings[sym] += qty;
      else if (order.type === 'SELL') holdings[sym] -= qty;
    });

    return Object.keys(holdings)
      .filter((sym) => holdings[sym] > 0.00001)
      .map((sym) => {
        const qty = holdings[sym];
        const currentPrice = stocks[sym]?.price || 0;
        const marketValue = qty * currentPrice;
        return { symbol: sym, quantity: qty, marketValue };
      });
  };

  const portfolioItems = calculatePortfolio();

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>💼 My Portfolio</h3>
      {portfolioItems.length === 0 ? (
        <p style={{ color: '#848e9c', margin: 0 }}>No active holdings.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>SYMBOL</th>
              <th style={styles.th}>QUANTITY</th>
              <th style={styles.thRight}>MARKET VALUE</th>
            </tr>
          </thead>
          <tbody>
            {portfolioItems.map((item) => (
              <tr key={item.symbol} style={styles.tr}>
                <td style={styles.tdSymbol}>{item.symbol}</td>
                <td style={styles.td}>{item.quantity}</td>
                <td style={styles.tdRight}>
                  ${item.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles = {
  card: { backgroundColor: '#1e2329', borderRadius: '12px', padding: '24px', border: '1px solid #2b313a' },
  title: { margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#eaecef' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '11px', color: '#848e9c', paddingBottom: '12px', fontWeight: '600' },
  thRight: { textAlign: 'right', fontSize: '11px', color: '#848e9c', paddingBottom: '12px', fontWeight: '600' },
  tr: { borderTop: '1px solid #2b313a' },
  tdSymbol: { padding: '12px 0', color: '#eaecef', fontWeight: '600' },
  td: { padding: '12px 0', color: '#848e9c' },
  tdRight: { padding: '12px 0', textAlign: 'right', color: '#f0b90b', fontWeight: '600' }
};