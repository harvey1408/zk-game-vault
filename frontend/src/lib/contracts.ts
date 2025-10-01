import { Account, Contract, ProviderInterface } from 'starknet';
// Import deployed Dojo manifest (dev)
// Using a direct import to avoid .env usage per project rules
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - allow json import without assertion in Next
import manifest from '../../../cairo-contracts/manifest_dev.json';

type DeployedContract = {
  address: string;
  abi: any[];
  tag?: string;
};

function findByTag(tag: string): DeployedContract | null {
  const list = (manifest as any)?.contracts as DeployedContract[] | undefined;
  if (!Array.isArray(list)) return null;
  const item = list.find((c) => c.tag === tag);
  return item ?? null;
}

const identityEntry = findByTag('dojo_starter-identity_vault');
const tictactoeEntry = findByTag('dojo_starter-tictactoe');

export const IDENTITY_CONTRACT_ADDRESS = identityEntry?.address ?? '';
export const IDENTITY_CONTRACT_ABI: any = identityEntry?.abi ?? [];
export const TICTACTOE_CONTRACT_ADDRESS = tictactoeEntry?.address ?? '';
export const TICTACTOE_CONTRACT_ABI: any = tictactoeEntry?.abi ?? [];

export function getIdentityContract(client: Account | ProviderInterface) {
  if (!IDENTITY_CONTRACT_ADDRESS || !Array.isArray(IDENTITY_CONTRACT_ABI)) return null;
  return new Contract(IDENTITY_CONTRACT_ABI, IDENTITY_CONTRACT_ADDRESS, client);
}

export function getTicTacToeContract(client: Account | ProviderInterface) {
  if (!TICTACTOE_CONTRACT_ADDRESS || !Array.isArray(TICTACTOE_CONTRACT_ABI)) return null;
  return new Contract(TICTACTOE_CONTRACT_ABI, TICTACTOE_CONTRACT_ADDRESS, client);
}


