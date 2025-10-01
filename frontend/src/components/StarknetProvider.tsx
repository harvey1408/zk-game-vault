'use client';

import React from 'react';
import { StarknetConfig, publicProvider } from '@starknet-react/core';
import { sepolia } from '@starknet-react/chains';

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  return (
    <StarknetConfig
      chains={[sepolia]}
      provider={publicProvider()}
      autoConnect
    >
      {children}
    </StarknetConfig>
  );
}
