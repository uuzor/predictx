import { ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { config } from '@/lib/wagmi'

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      {children}
    </WagmiProvider>
  )
}
