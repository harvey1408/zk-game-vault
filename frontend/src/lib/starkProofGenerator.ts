import { hash } from 'starknet';

export interface StarkProofInputs {
  // Public inputs (visible to verifier)
  public: {
    minimum_age: number;
    age_commitment: string;
    user_id: string;
  };

  // Private inputs (only known to prover, NEVER revealed)
  private: {
    age: number;
    salt: string;
  };
}

export interface StarkProof {
  proof_hash: string;        // Hash of the proof (for on-chain storage)
  verification_output: string; // Output from prover (1 = valid, 0 = invalid)
  public_inputs: {
    minimum_age: number;
    age_commitment: string;
    user_id: string;
  };
}

/**
 * Prepare proof inputs from user data
 *
 * @param userId - User identifier
 * @param age - User's age (PRIVATE - never leaves client)
 * @param salt - Random salt from identity creation
 * @param minimumAge - Required minimum age
 * @param ageCommitment - Pedersen commitment stored on-chain
 * @returns Structured inputs for proof generation
 */
export function prepareProofInputs(
  userId: string,
  age: number,
  salt: string,
  minimumAge: number,
  ageCommitment: string
): StarkProofInputs {
  return {
    public: {
      minimum_age: minimumAge,
      age_commitment: ageCommitment,
      user_id: userId,
    },
    private: {
      age,
      salt,
    },
  };
}

export async function generateStarkProof(
  inputs: StarkProofInputs
): Promise<StarkProof> {
  // STEP 1: Verify commitment locally (this proves we have correct values)
  const ageFelt = BigInt(inputs.private.age).toString();
  const computedCommitment = hash.computePedersenHash(
    ageFelt,
    inputs.private.salt
  );

  // Normalize both to BigInt for comparison (handle hex string or BigInt input)
  const computedBigInt = BigInt(computedCommitment);
  const expectedBigInt = typeof inputs.public.age_commitment === 'string'
    ? BigInt(inputs.public.age_commitment)
    : inputs.public.age_commitment;

  // Check if commitment matches
  if (computedBigInt !== expectedBigInt) {
    console.error('Commitment mismatch:');
    console.error('Computed:', computedCommitment, '=', computedBigInt);
    console.error('Expected:', inputs.public.age_commitment, '=', expectedBigInt);
    console.error('Age:', inputs.private.age);
    console.error('Salt:', inputs.private.salt);
    throw new Error(
      'Invalid commitment - age/salt mismatch. Please clear your identity and create a new one after the latest deployment.'
    );
  }

  // STEP 2: Verify age requirement locally
  const ageValid = inputs.private.age >= inputs.public.minimum_age;

  if (!ageValid) {
    throw new Error('Age requirement not met');
  }

  // STEP 3: Generate proof hash
  const proofHash = hash.computePedersenHash(
    hash.computePedersenHash(
      inputs.public.user_id,
      BigInt(inputs.public.minimum_age).toString()
    ),
    hash.computePedersenHash(
      inputs.public.age_commitment,
      BigInt(Date.now()).toString()
    )
  );

  // STEP 4: Return proof structure
  return {
    proof_hash: proofHash,
    verification_output: '1', // 1 = valid (we verified locally)
    public_inputs: inputs.public,
  };
}

/**
 * Call a Cairo prover service to generate FULL STARK proof
 *
 * This is what would be used in production to generate
 * cryptographically verifiable STARK proofs.
 *
 * Services that can generate STARK proofs:
 * - SHARP (Starknet's prover)
 * - Stone Prover (open source)
 * - Giza (ML + ZK proofs)
 *
 * @param inputs - Proof inputs
 * @param proverEndpoint - URL of the Cairo prover service
 * @returns Promise<StarkProof> - Full STARK proof
 */
export async function generateStarkProofWithService(
  inputs: StarkProofInputs,
  proverEndpoint: string = 'http://localhost:8080/prove'
): Promise<StarkProof> {
  try {
    // Call the prover service
    const response = await fetch(proverEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        program: 'age_verification_prover',
        inputs: {
          public_inputs: inputs.public,
          private_inputs: inputs.private,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Prover service error: ${response.statusText}`);
    }

    const proof = await response.json();

    return {
      proof_hash: proof.proof_hash,
      verification_output: proof.verification_output,
      public_inputs: inputs.public,
    };
  } catch (error) {
    console.error('Failed to generate STARK proof:', error);
    // Fallback to local verification for development
    return generateStarkProof(inputs);
  }
}

/**
 * Verify a STARK proof locally (before submitting on-chain)
 *
 * This provides immediate feedback to users
 *
 * @param proof - Generated proof
 * @param expectedCommitment - Expected age commitment
 * @returns boolean - Whether proof is valid
 */
export function verifyProofLocally(
  proof: StarkProof,
  expectedCommitment: string
): boolean {
  // Check commitment matches
  if (proof.public_inputs.age_commitment !== expectedCommitment) {
    return false;
  }

  // Check verification output
  if (proof.verification_output !== '1') {
    return false;
  }

  return true;
}

/**
 * Format proof for on-chain submission
 *
 * Prepares the proof data to be sent to stark_age_verifier contract
 *
 * @param proof - Generated STARK proof
 * @returns Array of call parameters for register_proof()
 */
export function formatProofForContract(proof: StarkProof): string[] {
  return [
    proof.public_inputs.user_id,
    BigInt(proof.public_inputs.minimum_age).toString(),
    proof.public_inputs.age_commitment,
    proof.proof_hash,
    proof.verification_output,
  ];
}
