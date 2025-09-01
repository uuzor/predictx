import { useEffect, useState } from 'react';

type Status = 'connected' | 'connecting' | 'disconnected';

export function StatusBadge() {
  const [status, setStatus] = useState<Status>('disconnected');
  const [sessionOpen, setSessionOpen] = useState<boolean>(false);
  const [lastRpc, setLastRpc] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchStatus() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        if (!mounted) return;
        const conn = data?.yellowNetwork?.connection as Status | undefined;
        const so = Boolean(data?.yellowNetwork?.sessionOpen);
        const ts = (data?.yellowNetwork?.lastRpcTimestamp ?? null) as number | null;
        if (conn) setStatus(conn);
        setSessionOpen(so);
        setLastRpc(ts);
      } catch {
        if (mounted) setStatus('disconnected');
      }
    }

    fetchStatus();
    const id = setInterval(fetchStatus, 5000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const color =
    status === 'connected' ? 'bg-green-500' :
    status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500';

  const tooltip = `Yellow Network: ${status}` +
    (sessionOpen ? ' • session open' : ' • session closed') +
    (lastRpc ? ` • last RPC ${Math.round((Date.now() - lastRpc)/1000)}s ago` : '');

  return (
    <div className="inline-flex items-center space-x-2 rounded-full border border-border px-3 py-1 text-xs bg-muted/60" title={tooltip}>
      <span className={`inline-block w-2 h-2 rounded-full ${color}`}></span>
      <span className="text-muted-foreground">Yellow: {status}</span>
    </div>
  );
}