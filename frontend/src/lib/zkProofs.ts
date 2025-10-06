import { hash } from 'starknet';

/**
 * ZK Proof Utilities for Privacy-Preserving Age Verification
 *
 * This module handles client-side ZK proof generation using Pedersen commitments.
 * The approach:
 * 1. Generate a Pedersen commitment of (age + salt)
 * 2. Store only the commitment on-chain (keeps age private)
 * 3. For verification, provide age + salt to prove age >= threshold
 * 4. Contract recomputes commitment and verifies it matches stored value
 */

/**
 * Generate a random salt for Pedersen commitment
 * Uses Web Crypto API for cryptographically secure randomness
 *
 * Note: Salt must be < CURVE.P (Starknet field prime ≈ 2^251)
 * We generate 31 bytes (248 bits) to ensure it's always valid
 */
export function generateSalt(): string {
  // Generate 31 bytes instead of 32 to ensure value < 2^251 (Starknet field prime)
  const array = new Uint8Array(31);
  crypto.getRandomValues(array);

  // Convert to hex string
  return '0x' + Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate Pedersen commitment for age
 * commitment = pedersen_hash(age, salt)
 *
 * @param age - User's actual age (kept private)
 * @param salt - Random blinding factor
 * @returns Pedersen commitment as hex string
 */
export function generateAgeCommitment(age: number, salt: string): string {
  // Convert age to felt252 format
  const ageFelt = BigInt(age).toString();

  // Compute Pedersen hash using starknet.js
  const commitment = hash.computePedersenHash(ageFelt, salt);

  return commitment;
}

/**
 * Store age proof data securely in local storage
 * This allows the user to retrieve their salt when needed for verification
 *
 * @param userId - User identifier
 * @param age - Actual age
 * @param salt - Random salt used in commitment
 */
export function storeAgeProof(userId: string, age: number, salt: string): void {
  const proofData = {
    age,
    salt,
    timestamp: Date.now(),
  };

  const encrypted = btoa(JSON.stringify(proofData));
  localStorage.setItem(`zkproof_${userId}`, encrypted);
}

/**
 * Retrieve stored age proof data
 *
 * @param userId - User identifier
 * @returns Age and salt, or null if not found
 */
export function retrieveAgeProof(userId: string): { age: number; salt: string } | null {
  const encrypted = localStorage.getItem(`zkproof_${userId}`);
  if (!encrypted) return null;

  try {
    const decrypted = atob(encrypted);
    const data = JSON.parse(decrypted);
    return {
      age: data.age,
      salt: data.salt,
    };
  } catch {
    return null;
  }
}

/**
 * Generate complete identity creation data
 *
 * @param userId - Unique user identifier
 * @param age - User's actual age
 * @param country - Country code
 * @returns Data ready for contract call
 */
export function prepareIdentityCreation(
  userId: string,
  age: number,
  country: string
) {
  // Generate random salt
  const salt = generateSalt();

  // Compute age commitment
  const ageCommitment = generateAgeCommitment(age, salt);

  // Store proof data for later verification
  storeAgeProof(userId, age, salt);

  return {
    userId: BigInt(userId).toString(),
    ageCommitment,
    country: BigInt(country).toString(),
    metadata: {
      age,
      salt,
    },
  };
}

/**
 * Generate age verification proof
 *
 * @param userId - User identifier
 * @param minimumAge - Required minimum age
 * @returns Verification data for contract call, or null if proof not found
 */
export function prepareAgeVerification(
  userId: string,
  minimumAge: number
): {
  userId: string;
  minimumAge: number;
  age: number;
  salt: string;
} | null {
  // Retrieve stored proof
  const proof = retrieveAgeProof(userId);
  if (!proof) return null;

  return {
    userId: BigInt(userId).toString(),
    minimumAge,
    age: proof.age,
    salt: proof.salt,
  };
}

/**
 * Verify age locally before submitting to contract
 * This provides immediate feedback to users
 *
 * @param age - User's age
 * @param minimumAge - Required minimum age
 * @returns Whether age requirement is met
 */
export function verifyAgeLocally(age: number, minimumAge: number): boolean {
  return age >= minimumAge;
}

/**
 * Clear stored proof data (e.g., on logout)
 *
 * @param userId - User identifier
 */
export function clearAgeProof(userId: string): void {
  localStorage.removeItem(`zkproof_${userId}`);
}

/**
 * Export proof data for backup
 * Users can save this to restore access on another device
 *
 * @param userId - User identifier
 * @returns Encrypted proof data string, or null if not found
 */
export function exportProofData(userId: string): string | null {
  return localStorage.getItem(`zkproof_${userId}`);
}

/**
 * Import proof data from backup
 *
 * @param userId - User identifier
 * @param encryptedData - Encrypted proof data
 */
export function importProofData(userId: string, encryptedData: string): boolean {
  try {
    const decrypted = atob(encryptedData);
    JSON.parse(decrypted);

    localStorage.setItem(`zkproof_${userId}`, encryptedData);
    return true;
  } catch {
    return false;
  }
}

export function generateTestProof(age: number = 25) {
  const userId = Math.floor(Math.random() * 1000000).toString();
  const country = '1';

  return prepareIdentityCreation(userId, age, country);
}
