import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Wallet, LogOut, Copy, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function WalletConnect() {
  const { address, isConnected, connector } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { signMessageAsync } = useSignMessage()
  const { toast } = useToast()

  const [copied, setCopied] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  // Authenticate with backend when wallet connects
  useEffect(() => {
    if (isConnected && address && !isAuthenticating) {
      authenticateWallet(address)
    }
  }, [isConnected, address])

  const authenticateWallet = async (walletAddress: string) => {
    try {
      setIsAuthenticating(true)

      // Generate a message to sign for authentication
      const message = `Sign this message to authenticate with PredictX.\n\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`

      // Request signature from user
      const signature = await signMessageAsync({ message })

      // Send authentication request to backend
      const response = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          signature,
          message,
        }),
      })

      if (!response.ok) {
        throw new Error('Authentication failed')
      }

      const data = await response.json()

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(data.user))

      toast({
        title: 'Wallet Connected',
        description: `Welcome, ${data.user.username}!`,
      })
    } catch (error: any) {
      console.error('Authentication error:', error)

      toast({
        title: 'Authentication Failed',
        description: error.message || 'Failed to authenticate wallet',
        variant: 'destructive',
      })

      // Disconnect wallet if authentication fails
      disconnect()
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

      toast({
        title: 'Address Copied',
        description: 'Wallet address copied to clipboard',
      })
    }
  }

  const handleDisconnect = () => {
    disconnect()
    localStorage.removeItem('user')

    toast({
      title: 'Wallet Disconnected',
      description: 'You have been logged out',
    })
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Wallet className="h-4 w-4" />
            {formatAddress(address)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCopyAddress} className="cursor-pointer">
            {copied ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {copied ? 'Copied!' : 'Copy Address'}
          </DropdownMenuItem>
          <DropdownMenuItem className="text-xs text-muted-foreground">
            Connected via {connector?.name}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-2" disabled={isPending || isAuthenticating}>
          <Wallet className="h-4 w-4" />
          {isPending || isAuthenticating ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Connect Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {connectors.map((connector) => (
          <DropdownMenuItem
            key={connector.id}
            onClick={() => connect({ connector })}
            disabled={isPending}
            className="cursor-pointer"
          >
            <Wallet className="mr-2 h-4 w-4" />
            {connector.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
