import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_DIR = path.join(__dirname, 'solana_data');
const DATA_FILE = path.join(DATA_DIR, 'solana_prices.json');
const METADATA_FILE = path.join(DATA_DIR, 'metadata.json');
const CSV_FILE = path.join(DATA_DIR, 'solana_prices.csv');

async function doFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

async function getKrakenPrices(interval = 15) {
  const url = `https://api.kraken.com/0/public/OHLC?pair=SOLUSD&interval=${interval}`;
  const data = await doFetch(url);
  
  if (data.error && data.error.length > 0) {
    throw new Error(`Kraken API error: ${data.error.join(', ')}`);
  }
  
  const pairData = data.result['SOLUSD'];
  if (!pairData) {
    const pairName = Object.keys(data.result)[0];
    return data.result[pairName].map(k => ({
      timestamp: parseInt(k[0]) * 1000,
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      vwap: parseFloat(k[5]),
      volume: parseFloat(k[6]),
      count: parseInt(k[7]),
      source: 'kraken'
    }));
  }
  
  return pairData.map(k => ({
    timestamp: parseInt(k[0]) * 1000,
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    vwap: parseFloat(k[5]),
    volume: parseFloat(k[6]),
    count: parseInt(k[7]),
    source: 'kraken'
  }));
}

async function getBitstampPrices(step = 900, limit = 1000) {
  const url = `https://www.bitstamp.net/api/v2/ohlc/solusd/?step=${step}&limit=${limit}`;
  const data = await doFetch(url);
  
  if (!data.data || !data.data.ohlc) {
    throw new Error('Invalid response from Bitstamp');
  }
  
  return data.data.ohlc.map(c => ({
    timestamp: parseInt(c.timestamp) * 1000,
    open: parseFloat(c.open),
    high: parseFloat(c.high),
    low: parseFloat(c.low),
    close: parseFloat(c.close),
    volume: parseFloat(c.volume),
    source: 'bitstamp'
  }));
}

function loadExistingData() {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  }
  return [];
}

function loadMetadata() {
  if (fs.existsSync(METADATA_FILE)) {
    return JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
  }
  return {
    lastUpdated: null,
    totalRecords: 0,
    sources: [],
    intervals: []
  };
}

function saveData(prices, source, interval) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  const existing = loadExistingData();
  const existingTimestamps = new Set(existing.map(p => p.timestamp));
  
  const newPrices = prices.filter(p => !existingTimestamps.has(p.timestamp));
  
  const merged = [...existing, ...newPrices].sort((a, b) => a.timestamp - b.timestamp);
  
  fs.writeFileSync(DATA_FILE, JSON.stringify(merged, null, 2));
  
  const metadata = loadMetadata();
  metadata.lastUpdated = Date.now();
  metadata.totalRecords = merged.length;
  metadata.sources = [...new Set([...metadata.sources, source])];
  metadata.intervals = [...new Set([...metadata.intervals, interval])];
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
  
  exportToCSV(merged);
  
  return newPrices.length;
}

function exportToCSV(prices) {
  const headers = ['timestamp', 'datetime', 'open', 'high', 'low', 'close', 'volume', 'source'];
  const rows = prices.map(p => [
    p.timestamp,
    new Date(p.timestamp).toISOString(),
    p.open || '',
    p.high || '',
    p.low || '',
    p.close,
    p.volume || '',
    p.source || ''
  ]);
  
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  fs.writeFileSync(CSV_FILE, csv);
}

async function main() {
  const args = process.argv.slice(2);
  const source = args[0] || 'bitstamp';
  const limit = parseInt(args[1]) || 1000;
  
  let interval = '15m';
  let prices;
  
  try {
    if (source === 'kraken') {
      const intervalMinutes = args[1] || 15;
      interval = `${intervalMinutes}m`;
      prices = await getKrakenPrices(parseInt(intervalMinutes));
    } else if (source === 'bitstamp') {
      const step = args[1] || 900;
      interval = `${step / 60}m`;
      prices = await getBitstampPrices(parseInt(step), limit);
    } else {
      console.error('Unknown source. Use "kraken" or "bitstamp"');
      process.exit(1);
    }
    
    const newCount = saveData(prices, source, interval);
    const metadata = loadMetadata();
    
    console.log(`Fetched ${prices.length} price points. Added ${newCount} new records.`);
    console.log(`Total records: ${metadata.totalRecords}`);
    console.log(`Data saved to: ${DATA_FILE}`);
    console.log(`CSV export: ${CSV_FILE}`);
    
    if (prices.length > 0) {
      const latest = prices[prices.length - 1];
      const oldest = prices[0];
      console.log(`\nDate range:`);
      console.log(`  Oldest: ${new Date(oldest.timestamp).toISOString()}`);
      console.log(`  Latest: ${new Date(latest.timestamp).toISOString()}`);
    }
  } catch (error) {
    console.error('Error fetching data:', error.message);
    process.exit(1);
  }
}

main();
