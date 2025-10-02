// On-Chain STARK Age Verification Contract
// This is the equivalent of the Groth16Verifier Solidity contract

use dojo_starter::models::{Identity, VerificationToken, VerificationFact};

#[starknet::interface]
pub trait IStarkAgeVerifier<T> {
    fn register_proof(
        ref self: T,
        user_id: felt252,
        minimum_age: u8,
        age_commitment: felt252,
        proof_hash: felt252,
        verification_output: felt252,
    ) -> felt252;

    fn has_valid_proof(
        self: @T,
        user_id: felt252,
        minimum_age: u8
    ) -> bool;

    fn get_verification_token(
        self: @T,
        user_id: felt252,
        minimum_age: u8
    ) -> felt252;

    fn revoke_proof(
        ref self: T,
        user_id: felt252,
        minimum_age: u8
    );
}

#[dojo::contract]
pub mod stark_age_verifier {
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use dojo_starter::models::{Identity, VerificationToken, VerificationFact};
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use core::pedersen::pedersen;
    use super::IStarkAgeVerifier;

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct FactRegistered {
        #[key]
        pub fact_hash: felt252,
        pub user_id: felt252,
        pub minimum_age: u8,
        pub verified_at: u64,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct ProofVerified {
        #[key]
        pub user_id: felt252,
        pub minimum_age: u8,
        pub proof_hash: felt252,
        pub token_hash: felt252,
    }

    #[abi(embed_v0)]
    impl StarkAgeVerifierImpl of IStarkAgeVerifier<ContractState> {
        /// Register a verified age proof fact
        ///
        /// This function is called AFTER a STARK proof has been generated
        /// and verified off-chain. It registers the "fact" that the proof
        /// is valid.
        fn register_proof(
            ref self: ContractState,
            user_id: felt252,
            minimum_age: u8,
            age_commitment: felt252,
            proof_hash: felt252,
            verification_output: felt252,
        ) -> felt252 {
            let mut world = self.world_default();

            // Verify the user has an identity with this commitment
            let identity: Identity = world.read_model(user_id);
            assert(identity.age_commitment == age_commitment, 'Invalid identity commitment');

            // Verify the proof output indicates success
            assert(verification_output == 1, 'Proof verification failed');

            // Generate unique fact hash
            let fact_hash = pedersen(
                pedersen(user_id, minimum_age.into()),
                pedersen(age_commitment, proof_hash)
            );

            let timestamp = get_block_timestamp();

            // Register the fact
            let fact = VerificationFact {
                fact_hash,
                user_id,
                minimum_age,
                proof_hash,
                verified_at: timestamp,
                is_valid: true,
            };

            world.write_model(@fact);

            // Issue verification token
            let token_hash = pedersen(
                pedersen(user_id, minimum_age.into()),
                timestamp.into()
            );

            let token = VerificationToken {
                user_id,
                minimum_age,
                token_hash,
                verified_at: timestamp,
                expires_at: timestamp + 86400, // 24 hours
                is_valid: true,
            };

            world.write_model(@token);

            // Emit events
            world.emit_event(@FactRegistered {
                fact_hash,
                user_id,
                minimum_age,
                verified_at: timestamp,
            });

            world.emit_event(@ProofVerified {
                user_id,
                minimum_age,
                proof_hash,
                token_hash,
            });

            token_hash
        }

        /// Check if a valid verification fact exists
        fn has_valid_proof(
            self: @ContractState,
            user_id: felt252,
            minimum_age: u8
        ) -> bool {
            let world = self.world_default();

            // Check if user has a valid token
            let token: VerificationToken = world.read_model((user_id, minimum_age));

            if !token.is_valid {
                return false;
            }

            let current_time = get_block_timestamp();
            if current_time > token.expires_at {
                return false;
            }

            true
        }

        /// Get verification token for user
        fn get_verification_token(
            self: @ContractState,
            user_id: felt252,
            minimum_age: u8
        ) -> felt252 {
            let world = self.world_default();
            let token: VerificationToken = world.read_model((user_id, minimum_age));

            if !token.is_valid {
                return 0;
            }

            let current_time = get_block_timestamp();
            if current_time > token.expires_at {
                return 0;
            }

            token.token_hash
        }

        /// Revoke a verification token
        fn revoke_proof(
            ref self: ContractState,
            user_id: felt252,
            minimum_age: u8
        ) {
            let mut world = self.world_default();
            let caller = get_caller_address();

            // Only identity owner can revoke
            let identity: Identity = world.read_model(user_id);
            assert(identity.owner == caller, 'Not authorized');

            let mut token: VerificationToken = world.read_model((user_id, minimum_age));
            token.is_valid = false;
            world.write_model(@token);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"dojo_starter")
        }
    }
}
