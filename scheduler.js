import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'solana_data');
const LOG_FILE = path.join(DATA_DIR, 'scheduler.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logMessage);
  console.log(logMessage.trim());
}

async function runFetch() {
  const { execSync } = await import('child_process');
  
  try {
    log('Starting price fetch...');
    
    const fetchScript = path.join(__dirname, 'fetch_solana_prices.js');
    const output = execSync(`node ${fetchScript} bitstamp 900 1000`, {
      encoding: 'utf8',
      timeout: 60000
    });
    
    log(output.trim());
    log('Fetch completed successfully');
  } catch (error) {
    log(`Error: ${error.message}`);
    if (error.stdout) log(`stdout: ${error.stdout}`);
    if (error.stderr) log(`stderr: ${error.stderr}`);
  }
}

async function main() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  log('Scheduler started');
  
  const args = process.argv.slice(2);
  const intervalMinutes = parseInt(args[0]) || 15;
  
  if (args.includes('--once')) {
    await runFetch();
    return;
  }
  
  log(`Running every ${intervalMinutes} minutes...`);
  
  await runFetch();
  
  setInterval(async () => {
    await runFetch();
  }, intervalMinutes * 60 * 1000);
  
  process.on('SIGINT', () => {
    log('Scheduler stopped');
    process.exit(0);
  });
}

main();
