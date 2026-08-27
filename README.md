# Solana Price Data Collector & Backtest Tool

Free tools to collect Solana price data at 15-minute intervals and run backtest analyses.

## Data Sources

- **Bitstamp** (primary): Free public OHLC API, no key required
- **Kraken** (backup): Free public OHLC API, no key required

## Setup

```bash
# No dependencies needed - uses native Node.js fetch
```

## Usage

### 1. Fetch Historical Data

Fetch last 1000 data points (15-minute candles) from Bitstamp:
```bash
node fetch_solana_prices.js bitstamp 900 1000
```

Fetch from Kraken (15-minute intervals):
```bash
node fetch_solana_prices.js kraken 15
```

Supported intervals:
- Bitstamp: step in seconds (900 = 15m, 600 = 10m, 3600 = 1h)
- Kraken: interval in minutes (1, 5, 15, 30, 60, 240, 1440, 10080, 21600)

### 2. Run Backtests

Run all strategies:
```bash
node backtest.js all
```

Run specific strategy:
```bash
node backtest.js smaCrossover
node backtest.js rsi
node backtest.js macd
node backtest.js bollingerBands
```

With custom capital:
```bash
node backtest.js smaCrossover 50000
```

### 3. Continuous Data Collection

Run once:
```bash
node scheduler.js --once
```

Run continuously (fetches every 15 minutes):
```bash
node scheduler.js 15
```

Or set up with cron (Linux/Mac):
```bash
# Edit crontab
crontab -e

# Add line to fetch every 15 minutes
*/15 * * * * cd /path/to/project && node fetch_solana_prices.js bitstamp 900 1000 >> solana_data/cron.log 2>&1
```

## Data Storage

All data stored in `solana_data/`:
- `solana_prices.json` - Full price history
- `solana_prices.csv` - CSV export for analysis tools
- `metadata.json` - Collection stats
- `scheduler.log` - Scheduler logs

## Available Strategies

| Strategy | Description |
|----------|-------------|
| `smaCrossover` | 20/50 SMA crossover |
| `rsi` | RSI < 30 buy, > 70 sell |
| `macd` | MACD line crossover |
| `bollingerBands` | Price below lower band = buy, above upper = sell |

## Sample Output

```
Loaded 900 price records
Date range: 2026-08-18T10:30:00.000Z to 2026-08-27T19:15:00.000Z

======================================================================
Strategy                 Return %     Trades   Buy&Hold %
----------------------------------------------------------------------
smaCrossover              0.00%        0          43.79%
rsi                       0.00%        0          43.79%
macd                      0.00%        0          43.79%
bollingerBands            43.84%        1          43.79%

Best performer: bollingerBands (43.84%)
```

## Notes

- Bitstamp provides ~720 15-min candles (7.5 days) per request
- Kraken provides ~720 15-min candles per request
- Data is deduplicated on each fetch
- CSV export is automatically updated
- All timestamps in milliseconds (JavaScript) or ISO format (CSV)
