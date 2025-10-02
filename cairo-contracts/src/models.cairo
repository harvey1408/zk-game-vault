use starknet::ContractAddress;

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct Moves {
    #[key]
    pub player: ContractAddress,
    pub remaining: u8,
    pub last_direction: Option<Direction>,
    pub can_move: bool,
}

#[derive(Drop, Serde, Debug)]
#[dojo::model]
pub struct DirectionsAvailable {
    #[key]
    pub player: ContractAddress,
    pub directions: Array<Direction>,
}

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct Position {
    #[key]
    pub player: ContractAddress,
    pub vec: Vec2,
}

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct PositionCount {
    #[key]
    pub identity: ContractAddress,
    pub position: Span<(u8, u128)>,
}

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct Identity {
    #[key]
    pub user_id: felt252,
    pub identity_hash: felt252,
    pub age_commitment: felt252,  // Pedersen commitment of age + salt
    pub country: felt252,
    pub owner: ContractAddress,
    pub created_at: u64,
}

// STARK-Proof Based Age Verification
// This model stores ONLY the verification result, NOT the actual age
// The age itself is verified in the Cairo execution trace (STARK proof)
// and never stored on-chain
#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct AgeVerification {
    #[key]
    pub user_id: felt252,
    #[key]
    pub verification_id: felt252,  // Unique ID for each verification (timestamp-based)
    pub minimum_age: u8,           // Minimum age requirement (public)
    pub verified: bool,            // Verification result
    pub verified_at: u64,          // Timestamp of verification
    pub proof_hash: felt252,       // Hash(commitment, minimum_age) for audit trail
    // NOTE: Actual age is NEVER stored - it only exists in the STARK proof execution trace
}

// Zero-Knowledge Verification Token
// This token proves age verification without revealing the actual age
// Tokens are time-limited and can be used for multiple games
#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct VerificationToken {
    #[key]
    pub user_id: felt252,
    #[key]
    pub minimum_age: u8,
    pub token_hash: felt252,       // Cryptographic token proving verification
    pub verified_at: u64,          // Timestamp when token was issued
    pub expires_at: u64,           // Token expiration (prevents replay attacks)
    pub is_valid: bool,            // Token can be revoked
}

// STARK Verification Fact
// A "fact" is a cryptographically proven statement
// In this case: "user X has age >= Y" (proven by STARK proof)
#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct VerificationFact {
    #[key]
    pub fact_hash: felt252,        // Unique hash identifying this fact
    pub user_id: felt252,          // User this fact is about
    pub minimum_age: u8,           // Minimum age proven
    pub proof_hash: felt252,       // Hash of the STARK proof
    pub verified_at: u64,          // When fact was proven
    pub is_valid: bool,            // Fact can be invalidated
}

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct TicTacToeGame {
    #[key]
    pub game_id: felt252,
    pub player_x: ContractAddress,
    pub player_o: ContractAddress,
    pub current_player: ContractAddress,
    pub board1: u8,
    pub board2: u8,
    pub board3: u8,
    pub board4: u8,
    pub board5: u8,
    pub board6: u8,
    pub board7: u8,
    pub board8: u8,
    pub board9: u8,
    pub winner: ContractAddress,
    pub is_draw: bool,
    pub is_finished: bool,
    pub min_age_requirement: u8,
    pub created_at: u64,
}

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct GameMove {
    #[key]
    pub game_id: felt252,
    #[key]
    pub move_number: u8,
    pub player: ContractAddress,
    pub position: u8,
    pub timestamp: u64,
}

#[derive(Serde, Copy, Drop, Introspect, PartialEq, Debug, DojoStore, Default)]
pub enum Direction {
    #[default]
    Left,
    Right,
    Up,
    Down,
}

#[derive(Copy, Drop, Serde, IntrospectPacked, Debug, DojoStore)]
pub struct Vec2 {
    pub x: u32,
    pub y: u32,
}


impl DirectionIntoFelt252 of Into<Direction, felt252> {
    fn into(self: Direction) -> felt252 {
        match self {
            Direction::Left => 1,
            Direction::Right => 2,
            Direction::Up => 3,
            Direction::Down => 4,
        }
    }
}

impl OptionDirectionIntoFelt252 of Into<Option<Direction>, felt252> {
    fn into(self: Option<Direction>) -> felt252 {
        match self {
            Option::None => 0,
            Option::Some(d) => d.into(),
        }
    }
}

#[generate_trait]
impl Vec2Impl of Vec2Trait {
    fn is_zero(self: Vec2) -> bool {
        if self.x - self.y == 0 {
            return true;
        }
        false
    }

    fn is_equal(self: Vec2, b: Vec2) -> bool {
        self.x == b.x && self.y == b.y
    }
}

#[cfg(test)]
mod tests {
    use super::{Vec2, Vec2Trait};

    #[test]
    fn test_vec_is_zero() {
        assert(Vec2Trait::is_zero(Vec2 { x: 0, y: 0 }), 'not zero');
    }

    #[test]
    fn test_vec_is_equal() {
        let position = Vec2 { x: 420, y: 0 };
        assert(position.is_equal(Vec2 { x: 420, y: 0 }), 'not equal');
    }
}
