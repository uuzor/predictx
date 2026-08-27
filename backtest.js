import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'solana_data', 'solana_prices.json');

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    console.error('No data file found. Run fetch_solana_prices.js first.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function backtest(strategyFn, prices, initialCapital = 10000) {
  let capital = initialCapital;
  let holdings = 0;
  let trades = 0;
  
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1];
    const curr = prices[i];
    const signal = strategyFn(prev, curr, i, prices);
    
    if (signal === 'buy' && capital > 0) {
      holdings = capital / curr.close;
      capital = 0;
      trades++;
    } else if (signal === 'sell' && holdings > 0) {
      capital = holdings * curr.close;
      holdings = 0;
      trades++;
    }
  }
  
  const finalValue = capital + (holdings * prices[prices.length - 1].close);
  const returnPct = ((finalValue - initialCapital) / initialCapital) * 100;
  
  return {
    initialCapital,
    finalValue,
    returnPct,
    trades,
    buyAndHoldReturn: ((prices[prices.length - 1].close - prices[0].close) / prices[0].close) * 100
  };
}

function sma(prices, period) {
  if (prices.length < period) return null;
  const sum = prices.slice(-period).reduce((a, b) => a + b.close, 0);
  return sum / period;
}

function rsi(prices, period = 14) {
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i].close - prices[i - 1].close;
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

const strategies = {
  smaCrossover: (prev, curr) => {
    const data = global._currentBacktestSlice;
    const sma20 = sma(data, 20);
    const sma50 = sma(data, 50);
    const prevSma20 = sma(data.slice(0, -1), 20);
    const prevSma50 = sma(data.slice(0, -1), 50);
    
    if (prevSma20 && prevSma50 && sma20 && sma50) {
      if (prevSma20 < prevSma50 && sma20 > sma50) return 'buy';
      if (prevSma20 > prevSma50 && sma20 < sma50) return 'sell';
    }
    return 'hold';
  },
  
  rsi: (prev, curr) => {
    const data = global._currentBacktestSlice;
    const rsiVal = rsi(data);
    
    if (rsiVal < 30) return 'buy';
    if (rsiVal > 70) return 'sell';
    return 'hold';
  },
  
  macd: (prev, curr) => {
    const data = global._currentBacktestSlice;
    if (data.length < 26) return 'hold';
    
    const ema12 = calculateEMA(data.map(d => d.close), 12);
    const ema26 = calculateEMA(data.map(d => d.close), 26);
    const macdLine = ema12 - ema26;
    
    if (data.length < 27) return 'hold';
    
    const prevData = data.slice(0, -1);
    const prevEma12 = calculateEMA(prevData.map(d => d.close), 12);
    const prevEma26 = calculateEMA(prevData.map(d => d.close), 26);
    const prevMacd = prevEma12 - prevEma26;
    
    if (prevMacd < 0 && macdLine > 0) return 'buy';
    if (prevMacd > 0 && macdLine < 0) return 'sell';
    return 'hold';
  },
  
  bollingerBands: (prev, curr) => {
    const data = global._currentBacktestSlice;
    if (data.length < 20) return 'hold';
    
    const period = 20;
    const prices = data.slice(-period).map(d => d.close);
    const smaVal = prices.reduce((a, b) => a + b, 0) / period;
    const stdDev = Math.sqrt(prices.reduce((a, b) => a + Math.pow(b - smaVal, 2), 0) / period);
    
    const upper = smaVal + (2 * stdDev);
    const lower = smaVal - (2 * stdDev);
    
    if (curr.close < lower) return 'buy';
    if (curr.close > upper) return 'sell';
    return 'hold';
  }
};

function calculateEMA(prices, period) {
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  
  return ema;
}

async function main() {
  const args = process.argv.slice(2);
  const strategyName = args[0] || 'all';
  const initialCapital = parseFloat(args[1]) || 10000;
  
  const prices = loadData();
  console.log(`Loaded ${prices.length} price records`);
  console.log(`Date range: ${new Date(prices[0].timestamp).toISOString()} to ${new Date(prices[prices.length - 1].timestamp).toISOString()}\n`);
  
  const strategyList = strategyName === 'all' 
    ? Object.keys(strategies) 
    : [strategyName];
  
  const results = [];
  
  for (const name of strategyList) {
    if (!strategies[name]) {
      console.error(`Unknown strategy: ${name}`);
      console.log(`Available: ${Object.keys(strategies).join(', ')}`);
      process.exit(1);
    }
    
    global._currentBacktestSlice = prices;
    const result = backtest(strategies[name], prices, initialCapital);
    results.push({ name, ...result });
  }
  
  console.log('Backtest Results:');
  console.log('='.repeat(70));
  console.log('Strategy                 Return %     Trades   Buy&Hold %');
  console.log('-'.repeat(70));
  
  for (const r of results) {
    console.log(`${r.name.padEnd(25)} ${r.returnPct.toFixed(2)}%        ${r.trades.toString().padEnd(10)} ${r.buyAndHoldReturn.toFixed(2)}%`);
  }
  
  const best = results.reduce((a, b) => a.returnPct > b.returnPct ? a : b);
  console.log('\n' + '='.repeat(70));
  console.log(`Best performer: ${best.name} (${best.returnPct.toFixed(2)}%)`);
}

main();
