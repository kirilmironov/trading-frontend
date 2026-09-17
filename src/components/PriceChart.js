import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';

export default function PriceChart({ symbol, currentPrice }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const lastBarRef = useRef(null);

  // 1. Инициализация на графиката и зареждане на историята от Binance
  useEffect(() => {
    if (!chartContainerRef.current || !symbol) return;

    lastBarRef.current = null;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#334155',
      },
      width: chartContainerRef.current.clientWidth,
      height: 350,
      grid: {
        vertLines: { color: '#f1f5f9' },
        horzLines: { color: '#f1f5f9' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        // Форматираме UTC timestamp-а към локалното време на потребителя (България UTC+3)
        tickMarkFormatter: (time) => {
          const date = new Date(time * 1000);
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        },
      },
      localization: {
        timeFormatter: (time) => {
          const date = new Date(time * 1000);
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        },
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    const controller = new AbortController();

    fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=100`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;

        const formattedData = data.map((item) => ({
          time: Math.floor(item[0] / 1000),
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
        }));

        candlestickSeries.setData(formattedData);
        if (formattedData.length > 0) {
          lastBarRef.current = formattedData[formattedData.length - 1];
        }
        chart.timeScale().fitContent();
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Error fetching Binance klines:', err);
        }
      });

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      controller.abort();
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
    };
  }, [symbol]);

  // 2. Реално време: Обновяване на свещта при всяка цена от WebSocket
  useEffect(() => {
    const numericPrice = parseFloat(currentPrice);

    if (!candlestickSeriesRef.current || isNaN(numericPrice) || numericPrice <= 0) {
      return;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const currentMinuteBucket = currentTime - (currentTime % 60);

    if (!lastBarRef.current) {
      const initialBar = {
        time: currentMinuteBucket,
        open: numericPrice,
        high: numericPrice,
        low: numericPrice,
        close: numericPrice,
      };
      candlestickSeriesRef.current.update(initialBar);
      lastBarRef.current = initialBar;
      return;
    }

    const currentBar = lastBarRef.current;

    if (currentMinuteBucket > currentBar.time) {
      const newBar = {
        time: currentMinuteBucket,
        open: numericPrice,
        high: numericPrice,
        low: numericPrice,
        close: numericPrice,
      };
      candlestickSeriesRef.current.update(newBar);
      lastBarRef.current = newBar;
    } else {
      const updatedBar = {
        ...currentBar,
        high: Math.max(currentBar.high, numericPrice),
        low: Math.min(currentBar.low, numericPrice),
        close: numericPrice,
      };
      candlestickSeriesRef.current.update(updatedBar);
      lastBarRef.current = updatedBar;
    }
  }, [currentPrice]);

  const numericPrice = parseFloat(currentPrice);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>📈 {symbol} Real-Time Chart</h4>
        <span style={{ fontSize: '14px', fontWeight: '700', color: '#10b981' }}>
          {!isNaN(numericPrice) ? `$${numericPrice.toFixed(2)}` : '—'}
        </span>
      </div>
      <div ref={chartContainerRef} style={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }} />
    </div>
  );
}