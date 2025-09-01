// Thin client utilities to interact with the server-backed Yellow Network (Nitrolite) gateway.

export async function getYellowStatus(): Promise<{
  yellowNetwork: { connection: 'connected' | 'connecting' | 'disconnected'; sessionOpen?: boolean };
}> {
  const res = await fetch('/api/status');
  if (!res.ok) {
    throw new Error(`Status HTTP ${res.status}`);
  }
  return res.json();
}

export async function submitPredictionAPI(prediction: {
  assetId: string;
  predictionType: string;
  targetPrice?: number | string;
  direction?: string;
  timeFrame?: number;
  userId?: string;
  expiresAt?: string | Date;
}) {
  const res = await fetch('/api/predictions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prediction),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}
