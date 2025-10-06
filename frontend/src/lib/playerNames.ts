import { Account } from 'starknet';

export async function getPlayerName(
  account: Account,
  walletAddress: string
): Promise<string> {
  try {
    const normalizedAddress = walletAddress.startsWith('0x')
      ? walletAddress
      : '0x' + BigInt(walletAddress).toString(16);

    return normalizedAddress.slice(0, 6) + '...' + normalizedAddress.slice(-4);
  } catch (error) {
    console.error('Failed to format wallet address:', error);
    return walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4);
  }
}

export function saveWalletToUserMapping(walletAddress: string, userId: string): void {
  try {
    const mapping = JSON.parse(
      localStorage.getItem('wallet_to_user_map') || '{}'
    );
    mapping[walletAddress] = userId;
    localStorage.setItem('wallet_to_user_map', JSON.stringify(mapping));
  } catch (error) {
    console.error('Failed to save wallet mapping:', error);
  }
}

export function saveUserName(userId: string, name: string): void {
  try {
    const names = JSON.parse(localStorage.getItem('user_names') || '{}');
    names[userId] = name;
    localStorage.setItem('user_names', JSON.stringify(names));
  } catch (error) {
    console.error('Failed to save user name:', error);
  }
}

export function getUserName(userId: string): string {
  try {
    const names = JSON.parse(localStorage.getItem('user_names') || '{}');
    return names[userId] || `Player ${userId.slice(-4)}`;
  } catch (error) {
    return `Player ${userId.slice(-4)}`;
  }
}