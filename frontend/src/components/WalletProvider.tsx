'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface WalletContextType {
  lastConnectedConnector: string | null;
  setLastConnectedConnector: (connector: string | null) => void;
}

const WalletContext = createContext<WalletContextType>({
  lastConnectedConnector: null,
  setLastConnectedConnector: () => {},
});

export function useWalletContext() {
  return useContext(WalletContext);
}

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [lastConnectedConnector, setLastConnectedConnectorState] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('last_connected_connector');
      if (saved) {
        setLastConnectedConnectorState(saved);
      }
    } catch (error) {
      console.error('Failed to load connector from localStorage:', error);
    }
  }, []);

  const setLastConnectedConnector = (connector: string | null) => {
    try {
      if (connector) {
        localStorage.setItem('last_connected_connector', connector);
      } else {
        localStorage.removeItem('last_connected_connector');
      }
      setLastConnectedConnectorState(connector);
    } catch (error) {
      console.error('Failed to save connector to localStorage:', error);
    }
  };

  return (
    <WalletContext.Provider value={{ lastConnectedConnector, setLastConnectedConnector }}>
      {children}
    </WalletContext.Provider>
  );
}