export function nameToFelt252(name: string): string {
  const combined = `${Date.now()}_${name}`;
  let hash = 0;

  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return '0x' + Math.abs(hash).toString(16).padStart(8, '0');
}

export function storeUserName(userId: string, name: string): void {
  try {
    const stored = JSON.parse(localStorage.getItem('user_names') || '{}');
    stored[userId] = name;
    localStorage.setItem('user_names', JSON.stringify(stored));
  } catch (error) {
    console.error('Failed to store user name:', error);
  }
}

export function getUserName(userId: string): string {
  try {
    const stored = JSON.parse(localStorage.getItem('user_names') || '{}');
    return stored[userId] || `Player ${userId.slice(-4)}`;
  } catch (error) {
    console.error('Failed to get user name:', error);
    return `Player ${userId.slice(-4)}`;
  }
}

export function removeUserName(userId: string): void {
  try {
    const stored = JSON.parse(localStorage.getItem('user_names') || '{}');
    delete stored[userId];
    localStorage.setItem('user_names', JSON.stringify(stored));
  } catch (error) {
    console.error('Failed to remove user name:', error);
  }
}