import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Asset {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  category: string;
  predictionCount?: number;
  bullishSentiment?: number;
  accuracyRate?: number;
}

export default function Markets() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('volume');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ['/api/assets', { search: searchQuery, sort: sortBy, category: categoryFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (sortBy) params.append('sort', sortBy);
      if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter);

      const res = await fetch(`/api/assets?${params}`);
      if (!res.ok) throw new Error('Failed to fetch assets');
      return res.json();
    },
  });

  const { data: featuredAssets = [] } = useQuery<{
    trending: Asset[];
    mostPredicted: Asset[];
    highVolatility: Asset[];
  }>({
    queryKey: ['/api/assets/featured'],
    queryFn: async () => {
      const res = await fetch('/api/assets/featured');
      if (!res.ok) throw new Error('Failed to fetch featured assets');
      return res.json();
    },
  });

  const categories = [
    { value: 'all', label: 'All Markets' },
    { value: 'layer1', label: 'Layer 1' },
    { value: 'layer2', label: 'Layer 2' },
    { value: 'defi', label: 'DeFi' },
    { value: 'meme', label: 'Memecoins' },
    { value: 'stablecoin', label: 'Stablecoins' },
  ];

  const filteredAssets = assets;

  const formatPrice = (price: number) => {
    if (price < 1) return `$${price.toFixed(6)}`;
    if (price < 100) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
    return `$${volume.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-b from-background to-muted/30 py-12 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl lg:text-7xl font-black text-foreground mb-4">
              Markets
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover and predict on cryptocurrency markets. Real-time prices powered by CoinGecko.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-96">
              <Input
                type="search"
                placeholder="Search assets (e.g., Bitcoin, ETH)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="volume">Volume</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="change">24h Change</SelectItem>
                  <SelectItem value="marketcap">Market Cap</SelectItem>
                  <SelectItem value="predictions">Most Predicted</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2 border border-border rounded-md p-1">
                <Button
                  size="sm"
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('grid')}
                >
                  <i className="fas fa-th"></i>
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('list')}
                >
                  <i className="fas fa-list"></i>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Markets */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-foreground mb-8">Featured Markets</h2>

          <Tabs defaultValue="trending" className="space-y-6">
            <TabsList className="bg-background border border-border">
              <TabsTrigger value="trending">
                <i className="fas fa-fire mr-2"></i>
                Trending
              </TabsTrigger>
              <TabsTrigger value="predicted">
                <i className="fas fa-chart-line mr-2"></i>
                Most Predicted
              </TabsTrigger>
              <TabsTrigger value="volatile">
                <i className="fas fa-bolt mr-2"></i>
                High Volatility
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trending">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredAssets.trending?.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} />
                ))}
                {featuredAssets.trending?.length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    No trending assets available
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="predicted">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredAssets.mostPredicted?.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} showPredictionStats />
                ))}
                {featuredAssets.mostPredicted?.length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    No prediction data available
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="volatile">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredAssets.highVolatility?.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} />
                ))}
                {featuredAssets.highVolatility?.length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    No volatile assets available
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* All Markets */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-bold text-foreground">All Markets</h2>
            <Badge variant="outline" className="text-base px-3 py-1">
              {filteredAssets.length} Assets
            </Badge>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading markets...</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-search text-2xl text-muted-foreground"></i>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No assets found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
              }
            >
              {filteredAssets.map((asset) => (
                viewMode === 'grid' ? (
                  <AssetCard key={asset.id} asset={asset} />
                ) : (
                  <AssetListItem key={asset.id} asset={asset} />
                )
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

interface AssetCardProps {
  asset: Asset;
  showPredictionStats?: boolean;
}

function AssetCard({ asset, showPredictionStats }: AssetCardProps) {
  const isPriceUp = asset.priceChange24h > 0;

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-border">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/50 rounded-full flex items-center justify-center text-primary-foreground font-bold">
              {asset.symbol.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{asset.symbol.toUpperCase()}</h3>
              <p className="text-sm text-muted-foreground">{asset.name}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {asset.category}
          </Badge>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-2xl font-bold text-foreground">
              ${asset.currentPrice.toFixed(2)}
            </p>
            <p className={`text-sm font-medium ${isPriceUp ? 'text-green-500' : 'text-red-500'}`}>
              {isPriceUp ? '↑' : '↓'} {Math.abs(asset.priceChange24h).toFixed(2)}%
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">24h Volume</p>
              <p className="font-medium text-foreground">
                {formatVolume(asset.volume24h)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Market Cap</p>
              <p className="font-medium text-foreground">
                {formatVolume(asset.marketCap)}
              </p>
            </div>
          </div>

          {showPredictionStats && (
            <div className="pt-3 border-t border-border space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Predictions</span>
                <span className="font-medium text-foreground">{asset.predictionCount || 0}</span>
              </div>
              {asset.bullishSentiment !== undefined && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Community Sentiment</span>
                    <span className="font-medium text-foreground">
                      {asset.bullishSentiment}% Bullish
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${asset.bullishSentiment}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}

          <Button className="w-full mt-4">
            <i className="fas fa-chart-line mr-2"></i>
            Quick Predict
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AssetListItem({ asset }: AssetCardProps) {
  const isPriceUp = asset.priceChange24h > 0;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/50 rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
              {asset.symbol.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-[120px]">
              <h3 className="font-semibold text-foreground">{asset.symbol.toUpperCase()}</h3>
              <p className="text-sm text-muted-foreground">{asset.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-8">
            <div className="text-right min-w-[100px]">
              <p className="font-bold text-foreground">${asset.currentPrice.toFixed(2)}</p>
              <p className={`text-sm font-medium ${isPriceUp ? 'text-green-500' : 'text-red-500'}`}>
                {isPriceUp ? '↑' : '↓'} {Math.abs(asset.priceChange24h).toFixed(2)}%
              </p>
            </div>

            <div className="text-right min-w-[100px]">
              <p className="text-sm text-muted-foreground">Volume 24h</p>
              <p className="font-medium text-foreground">{formatVolume(asset.volume24h)}</p>
            </div>

            <div className="text-right min-w-[100px]">
              <p className="text-sm text-muted-foreground">Market Cap</p>
              <p className="font-medium text-foreground">{formatVolume(asset.marketCap)}</p>
            </div>

            <Badge variant="outline" className="min-w-[80px] justify-center">
              {asset.category}
            </Badge>

            <Button size="sm">
              <i className="fas fa-chart-line mr-2"></i>
              Predict
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatVolume(volume: number) {
  if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
  if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
  if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
  return `$${volume.toFixed(2)}`;
}
