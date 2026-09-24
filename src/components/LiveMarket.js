import React, { useState } from 'react';

export default function LiveMarket({ stocks, onSelectSymbol }) {
  const [searchQuery, setSearchQuery] = useState('');

  const stockList = Object.values(stocks || {});
  const filteredStocks = stockList.filter(
    (s) =>
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>📊 Live Market</h3>
        <input
          type="text"
          placeholder="🔍 Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      <div style={styles.listContainer}>
        {filteredStocks.length === 0 ? (
          <div style={styles.emptyState}>No assets found</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ASSET</th>
                <th style={styles.thRight}>LAST PRICE</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map((stock) => (
                <tr 
                  key={stock.symbol} 
                  onClick={() => onSelectSymbol(stock.symbol)} 
                  style={styles.tr}
                  className="market-row"
                >
                  <td style={styles.td}>
                    <div style={{ fontWeight: '700', color: '#eaecef', fontSize: '14px' }}>{stock.symbol}</div>
                    <div style={{ fontSize: '12px', color: '#848e9c', marginTop: '2px' }}>{stock.name}</div>
                  </td>
                  <td style={styles.tdRight}>
                    ${parseFloat(stock.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
    boxSizing: 'border-box'
  },
  header: { 
    display: 'flex', 
    justifyContent: 'space-between', // Коригирано от justify
    alignItems: 'center', 
    marginBottom: '20px' 
  },
  title: { margin: 0, fontSize: '18px', fontWeight: '700', color: '#eaecef' },
  searchInput: { 
    backgroundColor: '#121214', 
    border: '1px solid #2b313a', 
    color: '#eaecef', 
    padding: '8px 14px', 
    borderRadius: '8px', 
    fontSize: '13px', 
    outline: 'none',
    width: '140px'
  },
  listContainer: { 
    maxHeight: '520px', 
    overflowY: 'auto',
    paddingRight: '6px'
  },
  emptyState: {
    textAlign: 'center',
    color: '#848e9c',
    padding: '20px 0',
    fontSize: '14px'
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '11px', color: '#848e9c', paddingBottom: '14px', fontWeight: '600', letterSpacing: '0.5px' },
  thRight: { textAlign: 'right', fontSize: '11px', color: '#848e9c', paddingBottom: '14px', fontWeight: '600', letterSpacing: '0.5px' },
  tr: { borderTop: '1px solid #2b313a', cursor: 'pointer', transition: 'background-color 0.2s' },
  td: { padding: '14px 0' },
  tdRight: { padding: '14px 0', textAlign: 'right', color: '#0ecb81', fontWeight: '700', fontSize: '15px' }
};