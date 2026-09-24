import React from 'react';

export default function PositionsTable({ positions = [], stocks = {}, onClosePosition }) {
  const hasPositions = positions && positions.length > 0;

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>📈 Open Positions</h3>
      
      {!hasPositions ? (
        <div style={styles.emptyState}>No open margin/leveraged positions.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHeader}>
                <th style={styles.th}>SYMBOL</th>
                <th style={styles.th}>SIDE</th>
                <th style={styles.th}>QTY</th>
                <th style={styles.th}>ENTRY PRICE</th>
                <th style={styles.th}>MARK PRICE</th>
                <th style={styles.th}>UNREALIZED PnL</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => {
                const currentStock = stocks?.[pos.symbol];
                const entryPrice = parseFloat(pos.entryPrice || 0);
                const markPrice = parseFloat(currentStock?.price ?? entryPrice);
                const qty = parseFloat(pos.quantity || 0);

                const isLong = pos.side === 'LONG' || pos.side === 'BUY';
                const pnl = isLong
                  ? (markPrice - entryPrice) * qty
                  : (entryPrice - markPrice) * qty;

                const totalValue = entryPrice * qty;
                const pnlPercent = totalValue > 0 ? ((pnl / totalValue) * 100).toFixed(2) : '0.00';
                const isPositive = pnl >= 0;
                const pnlColor = isPositive ? '#0ecb81' : '#f6465d';

                return (
                  <tr key={pos.id} style={styles.tr}>
                    <td style={{ ...styles.td, fontWeight: '700' }}>{pos.symbol}</td>
                    <td style={styles.td}>
                      <span style={isLong ? styles.badgeLong : styles.badgeShort}>
                        {pos.side}
                      </span>
                    </td>
                    <td style={styles.td}>{qty}</td>
                    <td style={styles.td}>
                      ${entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </td>
                    <td style={styles.td}>
                      ${markPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </td>
                    <td style={{ ...styles.td, color: pnlColor, fontWeight: '700' }}>
                      {isPositive ? '+' : ''}${pnl.toFixed(2)} ({isPositive ? '+' : ''}{pnlPercent}%)
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <button
                        onClick={() => onClosePosition && onClosePosition(pos.id, markPrice)}
                        style={styles.closeBtn}
                      >
                        Market Close
                      </button>
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
  card: { 
    backgroundColor: '#1e2329', 
    borderRadius: '16px', 
    padding: '24px', 
    border: '1px solid #2b313a', 
    marginTop: '20px' 
  },
  title: { margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#eaecef' },
  emptyState: { 
    textAlign: 'center', 
    color: '#848e9c', 
    padding: '24px 0', 
    fontSize: '14px' 
  },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' },
  trHeader: { borderBottom: '1px solid #2b313a' },
  th: { padding: '12px 10px', color: '#848e9c', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #2b313a' },
  td: { padding: '12px 10px', color: '#eaecef' },
  badgeLong: { 
    backgroundColor: 'rgba(14, 203, 129, 0.15)', 
    color: '#0ecb81', 
    padding: '3px 8px', 
    borderRadius: '4px', 
    fontWeight: '700', 
    fontSize: '11px' 
  },
  badgeShort: { 
    backgroundColor: 'rgba(246, 70, 93, 0.15)', 
    color: '#f6465d', 
    padding: '3px 8px', 
    borderRadius: '4px', 
    fontWeight: '700', 
    fontSize: '11px' 
  },
  closeBtn: { 
    backgroundColor: '#f6465d', 
    color: '#ffffff', 
    border: 'none', 
    padding: '6px 12px', 
    borderRadius: '6px', 
    fontWeight: '600', 
    cursor: 'pointer', 
    fontSize: '12px',
    transition: 'opacity 0.2s'
  }
};