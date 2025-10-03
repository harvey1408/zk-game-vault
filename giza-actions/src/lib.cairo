// Giza Action: Age Verification STARK Prover
// This Cairo program generates STARK proofs for age verification
//
// Privacy guarantees:
// - Age and salt are PRIVATE inputs (never revealed)
// - Only commitment and minimum_age are PUBLIC
// - Proves: pedersen(age, salt) == commitment AND age >= minimum_age

use core::pedersen::pedersen;

/// Verification result returned by the prover
#[derive(Drop, Serde)]
pub struct VerificationResult {
    pub is_valid: felt252,         // 1 if valid, 0 if invalid
    pub proof_hash: felt252,       // Deterministic proof identifier
}

/// Main proving function for Giza Action
///
/// PRIVATE inputs (never revealed):
/// - age: User's actual age
/// - salt: Random salt used in commitment
///
/// PUBLIC inputs (visible to verifier):
/// - minimum_age: Required minimum age threshold
/// - age_commitment: Pedersen(age, salt) stored on-chain
/// - user_id: User identifier
pub fn prove_age_verification(
    // Private inputs
    age: u8,
    salt: felt252,
    // Public inputs
    minimum_age: u8,
    age_commitment: felt252,
    user_id: felt252,
) -> VerificationResult {
    // STEP 1: Verify commitment
    // Recompute: pedersen(age, salt) and compare with public commitment
    let age_felt: felt252 = age.into();
    let computed_commitment = pedersen(age_felt, salt);
    let commitment_valid = computed_commitment == age_commitment;

    // STEP 2: Verify age requirement
    let age_valid = age >= minimum_age;

    // STEP 3: Combine checks
    let is_valid = commitment_valid && age_valid;
    let is_valid_felt = if is_valid { 1 } else { 0 };

    // STEP 4: Generate deterministic proof hash
    // This serves as a unique identifier for this verification
    let proof_hash = pedersen(
        user_id,
        pedersen(age_commitment, minimum_age.into())
    );

    VerificationResult {
        is_valid: is_valid_felt,
        proof_hash
    }
}
