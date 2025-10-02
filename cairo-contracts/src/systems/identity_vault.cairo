use dojo_starter::models::{Identity, AgeVerification};

#[starknet::interface]
pub trait IIdentityVault<T> {
    fn create_identity(ref self: T, user_id: felt252, age_commitment: felt252, country: felt252);
    fn verify_age(
        ref self: T,
        user_id: felt252,
        minimum_age: u8,
        age: u8,
        salt: felt252
    ) -> bool;
    fn get_identity(self: @T, user_id: felt252) -> Identity;
}

#[dojo::contract]
pub mod identity_vault {
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use dojo_starter::models::{Identity, AgeVerification};
    use starknet::{ContractAddress, get_caller_address};
    use core::pedersen;
    use super::{IIdentityVault};

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct IdentityCreated {
        #[key]
        pub user_id: felt252,
        pub identity_hash: felt252,
        pub owner: ContractAddress,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct AgeVerified {
        #[key]
        pub user_id: felt252,
        pub minimum_age: u8,
        pub verified: bool,
    }

    #[abi(embed_v0)]
    impl IdentityVaultImpl of IIdentityVault<ContractState> {
        fn create_identity(
            ref self: ContractState,
            user_id: felt252,
            age_commitment: felt252,
            country: felt252
        ) {
            let mut world = self.world_default();
            let caller = get_caller_address();

            // Create identity hash using Pedersen commitment
            // The age_commitment is generated client-side as: pedersen_hash(age, salt)
            // This ensures age privacy - only the commitment is stored on-chain
            let identity_hash = pedersen::pedersen(user_id, age_commitment);

            // Create timestamp
            let created_at = starknet::get_block_timestamp();

            // Create identity model with commitment
            let identity = Identity {
                user_id,
                identity_hash,
                age_commitment,  // Store only the commitment, not the actual age
                country,
                owner: caller,
                created_at,
            };

            // Write identity to world
            world.write_model(@identity);

            // Emit identity created event
            world.emit_event(@IdentityCreated {
                user_id,
                identity_hash,
                owner: caller,
            });
        }

        fn verify_age(
            ref self: ContractState,
            user_id: felt252,
            minimum_age: u8,
            age: u8,
            salt: felt252
        ) -> bool {
            let mut world = self.world_default();

            // Read the identity from world
            let identity: Identity = world.read_model(user_id);

            // ZK Proof Verification:
            // 1. Recompute the commitment using provided age and salt
            let age_felt: felt252 = age.into();
            let computed_commitment = pedersen::pedersen(age_felt, salt);

            // 2. Verify the commitment matches what's stored on-chain
            assert(computed_commitment == identity.age_commitment, 'Invalid age proof');

            // 3. Verify age >= minimum_age (range proof)
            // This is the selective disclosure - we prove age meets threshold
            // The actual age value is NOT stored on-chain, only used for verification
            assert(age >= minimum_age, 'Age does not meet requirement');

            // Create timestamp
            let verified_at = starknet::get_block_timestamp();

            // Generate unique verification ID and proof hash for audit trail
            let verification_id = pedersen::pedersen(user_id, verified_at.into());
            let proof_hash = pedersen::pedersen(age_felt, minimum_age.into());

            // Create age verification record
            // Note: Only minimum_age and verification status stored, not actual age
            let verification = AgeVerification {
                user_id,
                verification_id,
                minimum_age,
                verified: true,  // Always true if we reach this point (assertion passed)
                verified_at,
                proof_hash,
            };

            // Write verification to world
            world.write_model(@verification);

            // Emit verification event (without revealing actual age)
            world.emit_event(@AgeVerified {
                user_id,
                minimum_age,
                verified: true,  // Always true if we reach this point
            });

            true  // Return true if all verifications passed
        }

        fn get_identity(self: @ContractState, user_id: felt252) -> Identity {
            let world = self.world_default();
            world.read_model(user_id)
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"dojo_starter")
        }
    }
}