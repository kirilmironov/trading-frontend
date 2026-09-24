import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';

export default function PriceChart({ symbol, currentPrice }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const lastBarRef = useRef(null);

  // Почистваме символа за Binance API (напр. BTC-USDT -> BTCUSDT)
  const cleanSymbol = symbol ? symbol.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';

  // 1. Инициализация на графиката и зареждане на историята от Binance
  useEffect(() => {
    if (!chartContainerRef.current || !cleanSymbol) return;

    lastBarRef.current = null;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#181a20' },
        textColor: '#848e9c',
      },
      width: chartContainerRef.current.clientWidth,
      height: 350,
      grid: {
        vertLines: { color: '#2b313a' },
        horzLines: { color: '#2b313a' },
      },
      rightPriceScale: {
        borderColor: '#2b313a',
      },
      timeScale: {
        borderColor: '#2b313a',
        timeVisible: true,
        secondsVisible: false,
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

    // Съвместимост между v4 и v5 на lightweight-charts
    const seriesOptions = {
      upColor: '#0ecb81',
      downColor: '#f6465d',
      borderVisible: false,
      wickUpColor: '#0ecb81',
      wickDownColor: '#f6465d',
    };

    const candlestickSeries = typeof chart.addSeries === 'function'
      ? chart.addSeries(CandlestickSeries, seriesOptions)
      : chart.addCandlestickSeries(seriesOptions);

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    const controller = new AbortController();

    fetch(`https://api.binance.com/api/v3/klines?symbol=${cleanSymbol}&interval=1m&limit=100`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Binance API error: ${res.statusText}`);
        return res.json();
      })
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

    // Автоматично преоразмеряване с ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      if (chartRef.current && width > 0) {
        chartRef.current.applyOptions({ width });
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      controller.abort();
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      candlestickSeriesRef.current = null;
    };
  }, [cleanSymbol]);

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
        <h4 style={{ margin: 0, fontSize: '15px', color: '#eaecef' }}>📈 {symbol} Real-Time Chart</h4>
        <span style={{ fontSize: '14px', fontWeight: '700', color: '#0ecb81' }}>
          {!isNaN(numericPrice) ? `$${numericPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : '—'}
        </span>
      </div>
      <div ref={chartContainerRef} style={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }} />
    </div>
  );
}