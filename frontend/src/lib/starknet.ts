import { RpcProvider, Account, ProviderInterface } from 'starknet';

interface StarknetWindowObject {
  starknet?: {
    account?: Account;
  };
}

export function getPublicProvider(): ProviderInterface {
  return new RpcProvider({ nodeUrl: 'https://starknet-sepolia.public.blastapi.io' });
}

export function getInjectedAccount(): Account | null {
  if (typeof window === 'undefined') return null;
  const starknetWindow = window as unknown as StarknetWindowObject;
  const wallet = starknetWindow?.starknet;
  const account: Account | undefined = wallet?.account;
  return account ?? null;
}

export function isWalletConnected(): boolean {
  return !!getInjectedAccount();
}


