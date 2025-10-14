'use client';

import { useAccount, useConnect, useDisconnect, useInjectedConnectors, Connector } from '@starknet-react/core';
import { useEffect, useMemo, useState } from 'react';
import { useWalletContext } from './WalletProvider';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { connectors: injected } = useInjectedConnectors({ recommended: [] });
  const { disconnect } = useDisconnect();
  const { setLastConnectedConnector } = useWalletContext();
  const [mounted, setMounted] = useState(false);
  const shortAddress = useMemo(() => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  // Combine all available connectors
  const available = useMemo(() => {
    const allConnectors = (connectors && connectors.length > 0) ? connectors : (injected || []);
    return allConnectors;
  }, [connectors, injected]);

  const handleConnect = (connector: Connector) => {
    setLastConnectedConnector(connector.id);
    connect({ connector });
  };

  const handleDisconnect = () => {
    setLastConnectedConnector(null);
    disconnect();
  };

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
          onClick={handleDisconnect}
          className="px-6 py-3 backdrop-void cyber-border-purple hover:glow-error text-white rounded-xl transition-all duration-300 text-header text-sm font-bold hover:scale-105"
          aria-label="Disconnect wallet"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-3 flex-wrap">
      {available.map((connector: Connector) => (
        <button
          key={connector.id}
          onClick={() => handleConnect(connector)}
          disabled={isPending}
          className="group relative px-6 py-3 holographic-card rounded-xl hover:scale-105 transition-all duration-300 overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
          aria-label={`Connect ${connector.name}`}
        >
          <span className="relative z-10 flex items-center gap-2 text-sm font-bold gradient-text-holographic">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--token-gold)] animate-pulse-glow" aria-hidden="true" />
            <span className="text-header">{isPending ? 'Connecting...' : `Connect ${connector.name}`}</span>
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
