import React from 'react';
import LiveMarket from '../../components/LiveMarket';
import OrderForm from '../../components/OrderForm';
import OrderHistory from '../../components/OrderHistory';
import Portfolio from '../../components/Portfolio';
import PriceChart from '../../components/PriceChart';
import SpotOcoOrders from './SpotOcoOrders';

export default function SpotTradingPage({
  stocks,
  orders,
  ocoOrders,
  positions,
  selectedStock,
  setSelectedStock,
  onPlaceOrder,
  onPlaceOcoOrder,
  onCancelOrder,
  onCancelOcoOrder,
  onSuccess,
}) {
  return (
    <>
      <div style={styles.dashboardGrid}>
        <div style={styles.leftColumn}>
          <Portfolio positions={positions} stocks={stocks} />

          <div style={styles.chartFrame}>
            <PriceChart symbol={selectedStock} currentPrice={stocks[selectedStock]?.price || 0} />
          </div>

          <OrderForm
            stocks={stocks}
            selectedStock={selectedStock}
            setSelectedStock={setSelectedStock}
            onPlaceOrder={onPlaceOrder}
            onPlaceOcoOrder={onPlaceOcoOrder}
            onSuccess={onSuccess}
          />
        </div>

        <LiveMarket stocks={stocks} onSelectSymbol={setSelectedStock} />
      </div>

      <div style={styles.orderHistory}>
        <OrderHistory orders={orders} onCancelOrder={onCancelOrder} />
      </div>
      <SpotOcoOrders orders={ocoOrders} onCancel={onCancelOcoOrder} />
    </>
  );
}

const styles = {
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  chartFrame: {
    backgroundColor: '#1e2329',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #2b313a',
  },
  orderHistory: {
    marginTop: '20px',
  },
};