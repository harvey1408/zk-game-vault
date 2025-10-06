import { RpcProvider, Account, ProviderInterface } from 'starknet';

export function getPublicProvider(): ProviderInterface {
  return new RpcProvider({ nodeUrl: 'https://starknet-sepolia.public.blastapi.io' });
}

export function getInjectedAccount(): Account | null {
  if (typeof window === 'undefined') return null;
  const anyWindow = window as any;
  const wallet = anyWindow?.starknet;
  const account: Account | undefined = wallet?.account;
  return account ?? null;
}

export function isWalletConnected(): boolean {
  return !!getInjectedAccount();
}


