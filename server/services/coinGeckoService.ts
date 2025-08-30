interface CoinGeckoPrice {
  [coinId: string]: {
    usd: number;
    usd_24h_change: number;
  };
}

interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  last_updated: string;
}

export class CoinGeckoService {
  private baseUrl = 'https://api.coingecko.com/api/v3';
  private apiKey = process.env.COINGECKO_API_KEY || process.env.COINGECKO_PRO_API_KEY;

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.apiKey) {
      headers['x-cg-pro-api-key'] = this.apiKey;
    }
    
    return headers;
  }

  async getSimplePrices(coinIds: string[]): Promise<CoinGeckoPrice> {
    const url = `${this.baseUrl}/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true`;
    
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getCoinMarkets(coinIds?: string[], limit: number = 250): Promise<CoinGeckoCoin[]> {
    let url = `${this.baseUrl}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`;
    
    if (coinIds && coinIds.length > 0) {
      url += `&ids=${coinIds.join(',')}`;
    }

    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getCoinHistory(coinId: string, date: string): Promise<any> {
    const url = `${this.baseUrl}/coins/${coinId}/history?date=${date}`;
    
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getCoinMarketChart(coinId: string, days: number = 1): Promise<any> {
    const url = `${this.baseUrl}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=hourly`;
    
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get real-time price for a specific coin
  async getCurrentPrice(coinId: string): Promise<number> {
    const prices = await this.getSimplePrices([coinId]);
    return prices[coinId]?.usd || 0;
  }

  // Get top cryptocurrencies by market cap
  async getTopCoins(limit: number = 10): Promise<CoinGeckoCoin[]> {
    return this.getCoinMarkets(undefined, limit);
  }

  // Get specific coins data
  async getCoinsData(coinIds: string[]): Promise<CoinGeckoCoin[]> {
    return this.getCoinMarkets(coinIds);
  }
}

export const coinGeckoService = new CoinGeckoService();
