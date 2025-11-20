import { describe, it, expect } from '@jest/globals';
import { Wallet } from 'ethers';

describe('Wallet Authentication', () => {
  it('should verify message signature correctly', async () => {
    const wallet = Wallet.createRandom();
    const message = `Sign this message to authenticate with PredictX.\n\nWallet: ${wallet.address}\nTimestamp: ${Date.now()}`;

    const signature = await wallet.signMessage(message);
    const recoveredAddress = Wallet.verifyMessage(message, signature);

    expect(recoveredAddress.toLowerCase()).toBe(wallet.address.toLowerCase());
  });

  it('should reject invalid signature', async () => {
    const wallet = Wallet.createRandom();
    const message = 'Test message';
    const signature = await wallet.signMessage(message);

    // Try to verify with different message
    const tamperedMessage = 'Tampered message';

    const recoveredAddress = Wallet.verifyMessage(tamperedMessage, signature);

    // Recovered address should not match original wallet
    expect(recoveredAddress.toLowerCase()).not.toBe(wallet.address.toLowerCase());
  });

  it('should create user with correct wallet address format', () => {
    const walletAddress = '0x1234567890123456789012345678901234567890';
    const username = `user_${walletAddress.slice(-6)}`;

    expect(username).toBe('user_567890');
    expect(walletAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });
});
