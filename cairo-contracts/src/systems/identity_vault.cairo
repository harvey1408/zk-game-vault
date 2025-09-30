use dojo_starter::models::{Identity, AgeVerification};

#[starknet::interface]
pub trait IIdentityVault<T> {
    fn create_identity(ref self: T, user_id: felt252, age: u8, country: felt252);
    fn verify_age(ref self: T, user_id: felt252, minimum_age: u8) -> bool;
    fn get_identity(self: @T, user_id: felt252) -> Identity;
}

#[dojo::contract]
pub mod identity_vault {
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use dojo_starter::models::{Identity, AgeVerification};
    use starknet::{ContractAddress, get_caller_address};
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
            age: u8,
            country: felt252
        ) {
            let mut world = self.world_default();
            let caller = get_caller_address();

            // Create identity hash using simple calculation (simplified ZK proof approach)
            let age_felt: felt252 = age.into();
            // In production, use proper ZK-STARK proof generation
            let identity_hash = (user_id * 1000) + age_felt + country;

            // Create timestamp (simplified - in production use proper oracle)
            let created_at = starknet::get_block_timestamp();

            // Create identity model
            let identity = Identity {
                user_id,
                identity_hash,
                age,
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

        fn verify_age(ref self: ContractState, user_id: felt252, minimum_age: u8) -> bool {
            let mut world = self.world_default();

            // Read the identity from world
            let identity: Identity = world.read_model(user_id);

            // Perform selective disclosure - only verify age >= minimum_age
            let is_verified = identity.age >= minimum_age;

            // Create timestamp
            let verified_at = starknet::get_block_timestamp();

            // Create age verification record
            let verification = AgeVerification {
                user_id,
                minimum_age,
                verified: is_verified,
                verified_at,
            };

            // Write verification to world
            world.write_model(@verification);

            // Emit verification event
            world.emit_event(@AgeVerified {
                user_id,
                minimum_age,
                verified: is_verified,
            });

            is_verified
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