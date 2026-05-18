// components/TradingViewWidget.tsx - TradingView widget with tabs

'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'

type WidgetType = 'chart' | 'overview' | 'stock'

export function TradingViewWidget() {
  const t = useTranslations('home.marketSnapshot')
  const [activeTab, setActiveTab] = useState<WidgetType>('chart')
  const containerRef = useRef<HTMLDivElement>(null)
  const scriptRef = useRef<HTMLScriptElement | null>(null)

  // Filter TradingView support portal errors from console
  // Note: These 403 errors are expected behavior from TradingView widgets
  // and do not affect functionality. They are filtered to keep console clean.
  useEffect(() => {
    if (typeof window === 'undefined') return

    const originalError = console.error
    const originalWarn = console.warn

    // Filter function for TradingView support portal errors
    const filterTradingViewErrors = (...args: any[]) => {
      const message = args.map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' ')
      // Suppress only TradingView support portal related errors
      if (
        message.includes('support-portal-problems') ||
        message.includes('support/support-portal-problems') ||
        message.includes('Chart.DataProblemModel') ||
        (message.includes('403') && message.includes('tradingview-widget.com'))
      ) {
        // Silently ignore these specific TradingView errors
        return
      }
      // Pass through all other errors
      originalError.apply(console, args)
    }

    // Override console.error to filter TradingView errors
    console.error = filterTradingViewErrors

    // Also intercept global errors
    const handleError = (event: ErrorEvent) => {
      const message = event.message || ''
      const source = event.filename || ''
      // Suppress TradingView support portal errors
      if (
        message.includes('support-portal-problems') ||
        source.includes('tradingview-widget.com/support')
      ) {
        event.preventDefault()
        return false
      }
    }

    window.addEventListener('error', handleError)

    // Cleanup: restore original console methods and remove event listener
    return () => {
      console.error = originalError
      console.warn = originalWarn
      window.removeEventListener('error', handleError)
    }
  }, [])

  useEffect(() => {
    // Capture containerRef.current in a variable to use in cleanup
    const container = containerRef.current
    if (!container) return

    // Complete cleanup: remove all scripts and content
    try {
      // Remove our tracked script
      if (scriptRef.current && container.contains(scriptRef.current)) {
        container.removeChild(scriptRef.current)
      }
      scriptRef.current = null

      // Remove all scripts that TradingView might have created
      const allScripts = container.querySelectorAll('script')
      allScripts.forEach((s) => {
        try {
          if (s.parentNode) {
            s.parentNode.removeChild(s)
          }
        } catch (e) {
          // Script may have been removed already
        }
      })

      // Completely clear the container and recreate structure
      container.innerHTML = ''

      // Recreate the widget container div based on active tab
      const widgetDiv = document.createElement('div')
      widgetDiv.className = 'tradingview-widget-container__widget'
      widgetDiv.style.width = '100%'
      widgetDiv.style.height = activeTab === 'chart' ? 'calc(100% - 32px)' : '100%'
      container.appendChild(widgetDiv)
    } catch (e) {
      // If cleanup fails, try to reset completely
      if (container) {
        container.innerHTML = ''
        const widgetDiv = document.createElement('div')
        widgetDiv.className = 'tradingview-widget-container__widget'
        widgetDiv.style.width = '100%'
        widgetDiv.style.height = activeTab === 'chart' ? 'calc(100% - 32px)' : '100%'
        container.appendChild(widgetDiv)
      }
    }

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      // Use containerRef.current here as it may have changed
      if (!containerRef.current) return

      // Create new script based on active tab
      const script = document.createElement('script')
      script.async = true
      script.type = 'text/javascript'

      switch (activeTab) {
      case 'chart':
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
        script.innerHTML = JSON.stringify({
          allow_symbol_change: true,
          calendar: false,
          details: false,
          hide_side_toolbar: true,
          hide_top_toolbar: false,
          hide_legend: false,
          hide_volume: false,
          hotlist: false,
          interval: 'D',
          locale: 'en',
          save_image: true,
          style: '1',
          symbol: 'NASDAQ:AAPL',
          theme: 'dark',
          timezone: 'Etc/UTC',
          backgroundColor: '#0F172A', // slate-950
          gridColor: 'rgba(148, 163, 184, 0.06)', // slate-400 with opacity
          watchlist: [],
          withdateranges: false,
          compareSymbols: [],
          studies: [],
          autosize: true,
        })
        break

      case 'overview':
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js'
        script.innerHTML = JSON.stringify({
          colorTheme: 'dark',
          dateRange: '12M',
          locale: 'en',
          largeChartUrl: '',
          isTransparent: false,
          showFloatingTooltip: false,
          plotLineColorGrowing: 'rgba(6, 182, 212, 1)', // cyan-500
          plotLineColorFalling: 'rgba(6, 182, 212, 1)', // cyan-500
          gridLineColor: 'rgba(148, 163, 184, 0.1)', // slate-400 with opacity
          scaleFontColor: '#E2E8F0', // slate-200
          belowLineFillColorGrowing: 'rgba(6, 182, 212, 0.12)',
          belowLineFillColorFalling: 'rgba(6, 182, 212, 0.12)',
          belowLineFillColorGrowingBottom: 'rgba(6, 182, 212, 0)',
          belowLineFillColorFallingBottom: 'rgba(6, 182, 212, 0)',
          symbolActiveColor: 'rgba(6, 182, 212, 0.12)',
          tabs: [
            {
              title: 'Indices',
              symbols: [
                { s: 'FOREXCOM:SPXUSD', d: 'S&P 500 Index' },
                { s: 'FOREXCOM:NSXUSD', d: 'US 100 Cash CFD' },
                { s: 'FOREXCOM:DJI', d: 'Dow Jones Industrial Average Index' },
                { s: 'INDEX:NKY', d: 'Japan 225' },
                { s: 'INDEX:DEU40', d: 'DAX Index' },
                { s: 'FOREXCOM:UKXGBP', d: 'FTSE 100 Index' },
              ],
              originalTitle: 'Indices',
            },
            {
              title: 'Futures',
              symbols: [
                { s: 'BMFBOVESPA:ISP1!', d: 'S&P 500' },
                { s: 'BMFBOVESPA:EUR1!', d: 'Euro' },
                { s: 'CMCMARKETS:GOLD', d: 'Gold' },
                { s: 'PYTH:WTI3!', d: 'WTI Crude Oil' },
                { s: 'BMFBOVESPA:CCM1!', d: 'Corn' },
              ],
              originalTitle: 'Futures',
            },
            {
              title: 'Bonds',
              symbols: [
                { s: 'EUREX:FGBL1!', d: 'Euro Bund' },
                { s: 'EUREX:FBTP1!', d: 'Euro BTP' },
                { s: 'EUREX:FGBM1!', d: 'Euro BOBL' },
              ],
              originalTitle: 'Bonds',
            },
            {
              title: 'Forex',
              symbols: [
                { s: 'FX:EURUSD', d: 'EUR to USD' },
                { s: 'FX:GBPUSD', d: 'GBP to USD' },
                { s: 'FX:USDJPY', d: 'USD to JPY' },
                { s: 'FX:USDCHF', d: 'USD to CHF' },
                { s: 'FX:AUDUSD', d: 'AUD to USD' },
                { s: 'FX:USDCAD', d: 'USD to CAD' },
              ],
              originalTitle: 'Forex',
            },
          ],
          support_host: 'https://www.tradingview.com',
          backgroundColor: '#0F172A', // slate-950
          width: '100%',
          height: '400',
          showSymbolLogo: true,
          showChart: true,
        })
        break

      case 'stock':
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-hotlists.js'
        script.innerHTML = JSON.stringify({
          exchange: 'US',
          colorTheme: 'dark',
          dateRange: '12M',
          showChart: true,
          locale: 'en',
          largeChartUrl: '',
          isTransparent: false,
          showSymbolLogo: false,
          showFloatingTooltip: false,
          plotLineColorGrowing: 'rgba(6, 182, 212, 1)', // cyan-500
          plotLineColorFalling: 'rgba(6, 182, 212, 1)', // cyan-500
          gridLineColor: 'rgba(148, 163, 184, 0.1)', // slate-400 with opacity
          scaleFontColor: '#E2E8F0', // slate-200
          belowLineFillColorGrowing: 'rgba(6, 182, 212, 0.12)',
          belowLineFillColorFalling: 'rgba(6, 182, 212, 0.12)',
          belowLineFillColorGrowingBottom: 'rgba(6, 182, 212, 0)',
          belowLineFillColorFallingBottom: 'rgba(6, 182, 212, 0)',
          symbolActiveColor: 'rgba(6, 182, 212, 0.12)',
          width: '100%',
          height: '400',
        })
        break
      }

      scriptRef.current = script
      containerRef.current.appendChild(script)
    }, 100) // Small delay to ensure cleanup is complete

    // Cleanup function
    return () => {
      clearTimeout(timeoutId)
      // Use captured container variable in cleanup
      if (scriptRef.current && container) {
        try {
          if (container.contains(scriptRef.current)) {
            container.removeChild(scriptRef.current)
          }
        } catch (e) {
          // Script may have been removed already
        }
        scriptRef.current = null
      }
      // Remove all scripts using captured container
      if (container) {
        const allScripts = container.querySelectorAll('script')
        allScripts.forEach((s) => {
          try {
            if (s.parentNode) {
              s.parentNode.removeChild(s)
            }
          } catch (e) {
            // Ignore errors
          }
        })
      }
    }
  }, [activeTab])

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('chart')}
          className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
            activeTab === 'chart'
              ? 'bg-white text-surface-950'
              : 'text-surface-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          {t('tabs.chart')}
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
            activeTab === 'overview'
              ? 'bg-white text-surface-950'
              : 'text-surface-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          {t('tabs.overview')}
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
            activeTab === 'stock'
              ? 'bg-white text-surface-950'
              : 'text-surface-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          {t('tabs.stock')}
        </button>
      </div>

      {/* Widget Container */}
      <div className="h-[400px] w-full overflow-hidden rounded-2xl border border-white/10 bg-surface-900/80">
        <div
          ref={containerRef}
          className="tradingview-widget-container w-full h-full"
          style={{ height: '100%', width: '100%' }}
        />
      </div>
    </div>
  )
}
