'use client';

import { useAccount, useConnect, useDisconnect, useInjectedConnectors } from '@starknet-react/core';
import { useEffect, useMemo, useState } from 'react';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { connectors: injected } = useInjectedConnectors({
    recommended: [],
    include: ["argentX", "braavos"],
    exclude: [],
  } as any);
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);
  const shortAddress = useMemo(() => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        disabled
        className="px-6 py-3 holographic-card rounded-xl text-[var(--text-secondary)] cursor-not-allowed"
      >
        <span className="text-header text-sm font-medium">Loading...</span>
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <div className="px-5 py-3 holographic-card rounded-xl group hover:scale-105 transition-all duration-300 flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--success-glow)] shadow-[0_0_10px_rgba(0,255,127,0.7)]" aria-hidden="true" />
          <span className="font-mono text-sm gradient-text-holographic font-semibold" aria-label={`Wallet connected: ${shortAddress}`}>
            {shortAddress}
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          className="px-6 py-3 backdrop-void cyber-border-purple hover:glow-error text-white rounded-xl transition-all duration-300 text-header text-sm font-bold hover:scale-105"
          aria-label="Disconnect wallet"
        >
          Disconnect
        </button>
      </div>
    );
  }

  const available = (connectors && connectors.length > 0) ? connectors : (injected || []);

  return (
    <div className="flex gap-3 flex-wrap">
      {available.map((connector: any) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
          className="group relative px-8 py-3 bg-[var(--cyber-blue)] hover:bg-[var(--cyber-blue)]/90 text-black font-bold rounded-xl transition-all duration-300 text-header text-sm overflow-hidden hover:scale-105"
          aria-label={`Connect ${connector.name}`}
        >
          <span className="relative z-10 flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--token-gold)] animate-pulse-glow" aria-hidden="true" />
            Connect {connector.name}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--cyber-blue)] via-[var(--neon-cyan)] to-[var(--cyber-purple)] opacity-0 group-hover:opacity-100 animate-gradient-shift" />
        </button>
      ))}
      {available.length === 0 && (
        <div className="px-5 py-3 holographic-card rounded-xl text-[var(--text-secondary)] text-sm">
          No wallets detected. Install Argent X or Braavos and refresh.
        </div>
      )}
    </div>
  );
}
