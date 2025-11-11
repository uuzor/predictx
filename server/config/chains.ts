/**
 * Multi-Chain Deployment Configuration for Yellow Network
 *
 * Yellow Network deploys on Arbitrum, Polygon, and Ethereum Mainnet
 * Configure different chains for development, testnet, and production
 */

export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  contracts: {
    adjudicator?: string;
    custody?: string;
    nitroliteChannel?: string;
  };
  clearNodeUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface NetworkConfig {
  development: ChainConfig;
  testnet: ChainConfig;
  production: ChainConfig;
}

/**
 * Ethereum Mainnet Configuration
 */
export const ethereumMainnet: ChainConfig = {
  chainId: 1,
  name: 'Ethereum Mainnet',
  rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
  explorerUrl: 'https://etherscan.io',
  contracts: {
    // TODO: Add actual contract addresses from Yellow Network deployment
    adjudicator: process.env.ETHEREUM_ADJUDICATOR_ADDRESS || '',
    custody: process.env.ETHEREUM_CUSTODY_ADDRESS || '',
    nitroliteChannel: process.env.ETHEREUM_CHANNEL_ADDRESS || '',
  },
  clearNodeUrl: process.env.CLEARNODE_URL || 'wss://clearnode.yellow.network/ws',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
};

/**
 * Arbitrum One Configuration
 */
export const arbitrumOne: ChainConfig = {
  chainId: 42161,
  name: 'Arbitrum One',
  rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
  explorerUrl: 'https://arbiscan.io',
  contracts: {
    adjudicator: process.env.ARBITRUM_ADJUDICATOR_ADDRESS || '',
    custody: process.env.ARBITRUM_CUSTODY_ADDRESS || '',
    nitroliteChannel: process.env.ARBITRUM_CHANNEL_ADDRESS || '',
  },
  clearNodeUrl: process.env.CLEARNODE_URL || 'wss://clearnode.yellow.network/ws',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
};

/**
 * Polygon Mainnet Configuration
 */
export const polygonMainnet: ChainConfig = {
  chainId: 137,
  name: 'Polygon Mainnet',
  rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
  explorerUrl: 'https://polygonscan.com',
  contracts: {
    adjudicator: process.env.POLYGON_ADJUDICATOR_ADDRESS || '',
    custody: process.env.POLYGON_CUSTODY_ADDRESS || '',
    nitroliteChannel: process.env.POLYGON_CHANNEL_ADDRESS || '',
  },
  clearNodeUrl: process.env.CLEARNODE_URL || 'wss://clearnode.yellow.network/ws',
  nativeCurrency: {
    name: 'Matic',
    symbol: 'MATIC',
    decimals: 18,
  },
};

/**
 * Ethereum Sepolia Testnet Configuration
 */
export const sepolia: ChainConfig = {
  chainId: 11155111,
  name: 'Sepolia Testnet',
  rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
  explorerUrl: 'https://sepolia.etherscan.io',
  contracts: {
    adjudicator: process.env.SEPOLIA_ADJUDICATOR_ADDRESS || '',
    custody: process.env.SEPOLIA_CUSTODY_ADDRESS || '',
    nitroliteChannel: process.env.SEPOLIA_CHANNEL_ADDRESS || '',
  },
  clearNodeUrl: process.env.CLEARNODE_URL_TESTNET || 'wss://testnet-clearnode.yellow.network/ws',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
};

/**
 * Arbitrum Sepolia Testnet Configuration
 */
export const arbitrumSepolia: ChainConfig = {
  chainId: 421614,
  name: 'Arbitrum Sepolia',
  rpcUrl: process.env.ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
  explorerUrl: 'https://sepolia.arbiscan.io',
  contracts: {
    adjudicator: process.env.ARBITRUM_SEPOLIA_ADJUDICATOR_ADDRESS || '',
    custody: process.env.ARBITRUM_SEPOLIA_CUSTODY_ADDRESS || '',
    nitroliteChannel: process.env.ARBITRUM_SEPOLIA_CHANNEL_ADDRESS || '',
  },
  clearNodeUrl: process.env.CLEARNODE_URL_TESTNET || 'wss://testnet-clearnode.yellow.network/ws',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
};

/**
 * Polygon Amoy Testnet Configuration
 */
export const polygonAmoy: ChainConfig = {
  chainId: 80002,
  name: 'Polygon Amoy Testnet',
  rpcUrl: process.env.POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
  explorerUrl: 'https://amoy.polygonscan.com',
  contracts: {
    adjudicator: process.env.POLYGON_AMOY_ADJUDICATOR_ADDRESS || '',
    custody: process.env.POLYGON_AMOY_CUSTODY_ADDRESS || '',
    nitroliteChannel: process.env.POLYGON_AMOY_CHANNEL_ADDRESS || '',
  },
  clearNodeUrl: process.env.CLEARNODE_URL_TESTNET || 'wss://testnet-clearnode.yellow.network/ws',
  nativeCurrency: {
    name: 'Matic',
    symbol: 'MATIC',
    decimals: 18,
  },
};

/**
 * Get chain configuration based on environment
 */
export function getChainConfig(): ChainConfig {
  const network = process.env.YELLOW_NETWORK || 'development';
  const preferredChain = process.env.YELLOW_CHAIN || 'arbitrum';

  switch (network) {
    case 'production':
      switch (preferredChain) {
        case 'ethereum':
          return ethereumMainnet;
        case 'polygon':
          return polygonMainnet;
        case 'arbitrum':
        default:
          return arbitrumOne;
      }

    case 'testnet':
      switch (preferredChain) {
        case 'ethereum':
          return sepolia;
        case 'polygon':
          return polygonAmoy;
        case 'arbitrum':
        default:
          return arbitrumSepolia;
      }

    case 'development':
    default:
      // Use Sepolia for development
      return sepolia;
  }
}

/**
 * Get all available chains for multi-chain support
 */
export function getAllChains(): ChainConfig[] {
  return [
    ethereumMainnet,
    arbitrumOne,
    polygonMainnet,
    sepolia,
    arbitrumSepolia,
    polygonAmoy,
  ];
}

/**
 * Get chain by ID
 */
export function getChainById(chainId: number): ChainConfig | undefined {
  return getAllChains().find((chain) => chain.chainId === chainId);
}

/**
 * Validate chain configuration
 */
export function validateChainConfig(config: ChainConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.rpcUrl) {
    errors.push('RPC URL is required');
  }

  if (!config.clearNodeUrl) {
    errors.push('ClearNode URL is required');
  }

  if (!config.contracts.adjudicator) {
    errors.push(`Adjudicator contract address missing for ${config.name}`);
  }

  if (!config.contracts.custody) {
    errors.push(`Custody contract address missing for ${config.name}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Log chain configuration (without sensitive data)
 */
export function logChainConfig(config: ChainConfig): void {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║    Yellow Network Chain Config        ║');
  console.log('╠═══════════════════════════════════════╣');
  console.log(`║ Network: ${config.name.padEnd(28)} ║`);
  console.log(`║ Chain ID: ${String(config.chainId).padEnd(27)} ║`);
  console.log(`║ RPC: ${config.rpcUrl.substring(0, 32).padEnd(32)} ║`);
  console.log(`║ ClearNode: ${config.clearNodeUrl.substring(0, 26).padEnd(26)} ║`);
  console.log('╚═══════════════════════════════════════╝');
}

export default {
  getChainConfig,
  getAllChains,
  getChainById,
  validateChainConfig,
  logChainConfig,
  ethereumMainnet,
  arbitrumOne,
  polygonMainnet,
  sepolia,
  arbitrumSepolia,
  polygonAmoy,
};
