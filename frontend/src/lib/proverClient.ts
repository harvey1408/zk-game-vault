/**
 * Prover Service Client
 *
 * This module communicates with the backend prover API to generate
 * cryptographically signed STARK proofs.
 */

export interface ProverRequest {
  age: number;
  salt: string | bigint;
  minimum_age: number;
  age_commitment: string | bigint;
  user_id: string | bigint;
}

export interface ProverResponse {
  success: boolean;
  is_valid: number;
  proof_hash: string;
  signature: {
    r: string;
    s: string;
  };
  error?: string;
}

/**
 * Call the prover service to generate a STARK proof with signature
 *
 * @param request Proof request with private and public inputs
 * @returns Proof response with signature
 */
export async function generateSignedProof(request: ProverRequest): Promise<ProverResponse> {
  // Convert BigInt values to strings for JSON serialization
  const serializedRequest = {
    age: request.age,
    salt: typeof request.salt === 'bigint' ? '0x' + request.salt.toString(16) : request.salt,
    minimum_age: request.minimum_age,
    age_commitment: typeof request.age_commitment === 'bigint'
      ? '0x' + request.age_commitment.toString(16)
      : request.age_commitment,
    user_id: typeof request.user_id === 'bigint'
      ? '0x' + request.user_id.toString(16)
      : request.user_id,
  };

  const response = await fetch('/api/generate-proof', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(serializedRequest),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Prover service error' }));
    throw new Error(error.error || 'Failed to generate proof');
  }

  return await response.json();
}

/**
 * Format signed proof for contract call
 *
 * @param userIdStr User ID
 * @param minAge Minimum age requirement
 * @param ageCommitment Age commitment from identity
 * @param proof Prover response with signature
 * @returns Formatted calldata array
 */
export function formatSignedProofForContract(
  userIdStr: string,
  minAge: number,
  ageCommitment: string,
  proof: ProverResponse
): [string, number, string, string, number, string, string] {
  return [
    userIdStr,
    minAge,
    ageCommitment,
    proof.proof_hash,
    proof.is_valid,
    proof.signature.r,
    proof.signature.s,
  ];
}
