import { NextRequest, NextResponse } from 'next/server';
import { hash, ec, encode } from 'starknet';

/**
 * Prover Service API Route
 *
 * This API route acts as a trusted prover service that:
 * 1. Receives private inputs (age, salt) + public inputs
 * 2. Verifies the Cairo logic (commitment + age check)
 * 3. Signs the verification result with prover's private key
 * 4. Returns signature that can be verified on-chain
 *
 * SECURITY: Prover private key stays server-side only (never exposed to browser)
 */

interface ProofRequest {
  // Private inputs (user sends these to prover)
  age: number;
  salt: string;

  // Public inputs
  minimum_age: number;
  age_commitment: string;
  user_id: string;
}

interface ProofResponse {
  success: boolean;
  is_valid: number;
  proof_hash: string;
  signature: {
    r: string;
    s: string;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ProofResponse>> {
  try {
    const body: ProofRequest = await request.json();
    const { age, salt, minimum_age, age_commitment, user_id } = body;

    // Validate inputs
    if (!age || !salt || !minimum_age || !age_commitment || !user_id) {
      return NextResponse.json({
        success: false,
        is_valid: 0,
        proof_hash: '0x0',
        signature: { r: '0x0', s: '0x0' },
        error: 'Missing required fields',
      }, { status: 400 });
    }

    // STEP 1: Verify commitment (Cairo prover logic)
    const ageFelt = BigInt(age).toString();
    const computedCommitment = hash.computePedersenHash(ageFelt, salt);

    // Normalize for comparison
    const computedBigInt = BigInt(computedCommitment);
    const expectedBigInt = typeof age_commitment === 'string'
      ? BigInt(age_commitment)
      : age_commitment;

    const commitmentValid = computedBigInt === expectedBigInt;

    // STEP 2: Verify age requirement
    const ageValid = age >= minimum_age;

    // STEP 3: Combine checks
    const isValid = commitmentValid && ageValid;
    const isValidFelt = isValid ? 1 : 0;

    // STEP 4: Generate proof hash (deterministic identifier)
    const proofHash = hash.computePedersenHash(
      user_id,
      hash.computePedersenHash(age_commitment, BigInt(minimum_age).toString())
    );

    // STEP 5: Sign the verification result
    // Message = pedersen(pedersen(user_id, minimum_age), pedersen(age_commitment, proof_hash))
    const message = hash.computePedersenHash(
      hash.computePedersenHash(user_id, BigInt(minimum_age).toString()),
      hash.computePedersenHash(age_commitment, proofHash)
    );

    // Get prover private key from environment
    const proverPrivateKey = process.env.PROVER_PRIVATE_KEY;
    if (!proverPrivateKey) {
      console.error('PROVER_PRIVATE_KEY not set in environment');
      return NextResponse.json({
        success: false,
        is_valid: 0,
        proof_hash: '0x0',
        signature: { r: '0x0', s: '0x0' },
        error: 'Prover not configured',
      }, { status: 500 });
    }

    // Sign with prover's private key
    const msgHash = message; // Already a hex string from computePedersenHash
    const signature = ec.starkCurve.sign(msgHash, proverPrivateKey);

    return NextResponse.json({
      success: true,
      is_valid: isValidFelt,
      proof_hash: proofHash,
      signature: {
        r: '0x' + signature.r.toString(16),
        s: '0x' + signature.s.toString(16),
      },
    });

  } catch (error: any) {
    console.error('Prover error:', error);
    return NextResponse.json({
      success: false,
      is_valid: 0,
      proof_hash: '0x0',
      signature: { r: '0x0', s: '0x0' },
      error: error.message || 'Prover failed',
    }, { status: 500 });
  }
}
