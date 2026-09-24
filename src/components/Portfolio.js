import React from 'react';

export default function Portfolio({ positions = [], stocks = {} }) {
  const calculatePortfolio = () => {
    // 1. Вземаме САМО отворените позиции
    const activePositions = positions.filter((pos) => {
      const isNotClosed = !pos.status || pos.status === 'OPEN';
      const hasQuantity = parseFloat(pos.quantity || 0) > 0.00001;
      return isNotClosed && hasQuantity;
    });

    // 2. Агрегираме сумите и количествата по символ (BTCUSDC, ETHUSDC...)
    const aggregated = activePositions.reduce((acc, pos) => {
      const sym = pos.symbol;
      const qty = parseFloat(pos.quantity || 0);
      const entryPrice = parseFloat(pos.entryPrice || pos.buyPrice || pos.price || 0);

      if (!acc[sym]) {
        acc[sym] = { quantity: 0, totalCost: 0 };
      }

      acc[sym].quantity += qty;
      acc[sym].totalCost += qty * entryPrice;
      return acc;
    }, {});

    // 3. Форматираме активите за показване в таблицата
    return Object.entries(aggregated).map(([sym, data]) => {
      const qty = data.quantity;
      const avgBuyPrice = data.totalCost / qty;
      const currentPrice = parseFloat(stocks[sym]?.price || avgBuyPrice);
      const marketValue = qty * currentPrice;
      const pnl = (currentPrice - avgBuyPrice) * qty;
      const pnlPercent = avgBuyPrice > 0 ? ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100 : 0;

      return {
        symbol: sym,
        quantity: qty,
        avgBuyPrice,
        currentPrice,
        marketValue,
        pnl,
        pnlPercent,
      };
    });
  };

  const portfolioItems = calculatePortfolio();
  const totalPortfolioValue = portfolioItems.reduce((acc, item) => acc + item.marketValue, 0);

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>💼 My Portfolio</h3>
        {portfolioItems.length > 0 && (
          <div style={styles.totalBadge}>
            Total: <span style={{ color: '#0ecb81', fontWeight: '700' }}>
              ${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>

      {portfolioItems.length === 0 ? (
        <p style={{ color: '#848e9c', margin: 0, fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
          No active holdings.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>SYMBOL</th>
                <th style={styles.th}>QTY</th>
                <th style={styles.thRight}>AVG PRICE</th>
                <th style={styles.thRight}>PNL</th>
                <th style={styles.thRight}>VALUE</th>
              </tr>
            </thead>
            <tbody>
              {portfolioItems.map((item) => {
                const isPositive = item.pnl >= 0;
                return (
                  <tr key={item.symbol} style={styles.tr}>
                    <td style={styles.tdSymbol}>{item.symbol}</td>
                    <td style={styles.td}>{item.quantity}</td>
                    <td style={styles.tdRight}>
                      ${item.avgBuyPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ ...styles.tdRight, color: isPositive ? '#0ecb81' : '#f6465d' }}>
                      {isPositive ? '+' : ''}${item.pnl.toFixed(2)} ({item.pnlPercent.toFixed(2)}%)
                    </td>
                    <td style={{ ...styles.tdRight, color: '#f0b90b', fontWeight: '700' }}>
                      ${item.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: { backgroundColor: '#1e2329', borderRadius: '16px', padding: '24px', border: '1px solid #2b313a' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  title: { margin: 0, fontSize: '18px', fontWeight: '700', color: '#eaecef' },
  totalBadge: { fontSize: '14px', color: '#848e9c', backgroundColor: '#121214', padding: '6px 12px', borderRadius: '8px', border: '1px solid #2b313a' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '11px', color: '#848e9c', paddingBottom: '12px', fontWeight: '600' },
  thRight: { textAlign: 'right', fontSize: '11px', color: '#848e9c', paddingBottom: '12px', fontWeight: '600' },
  tr: { borderTop: '1px solid #2b313a' },
  tdSymbol: { padding: '12px 0', color: '#eaecef', fontWeight: '700', fontSize: '14px' },
  td: { padding: '12px 0', color: '#848e9c', fontSize: '13px' },
  tdRight: { padding: '12px 0', textAlign: 'right', fontSize: '13px' }
};