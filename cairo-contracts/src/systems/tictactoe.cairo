use dojo_starter::models::TicTacToeGame;

#[starknet::interface]
pub trait ITicTacToe<T> {
    fn create_game(ref self: T, game_id: felt252, min_age_requirement: u8, user_id: felt252) -> felt252;
    fn join_game(ref self: T, game_id: felt252, user_id: felt252) -> bool;
    fn make_move(ref self: T, game_id: felt252, position: u8, user_id: felt252) -> bool;
    fn cancel_game(ref self: T, game_id: felt252) -> bool;
    fn get_game(self: @T, game_id: felt252) -> TicTacToeGame;
    fn set_verifier(ref self: T, verifier_address: starknet::ContractAddress);
}

#[dojo::contract]
pub mod tictactoe {
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use dojo_starter::models::{TicTacToeGame, GameMove};
    use dojo_starter::systems::stark_age_verifier::{IStarkAgeVerifierDispatcher, IStarkAgeVerifierDispatcherTrait};
    use starknet::{get_caller_address, ContractAddress, contract_address_const};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use super::{ITicTacToe};

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct GameCreated {
        #[key]
        pub game_id: felt252,
        pub creator: felt252,
        pub min_age_requirement: u8,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct GameJoined {
        #[key]
        pub game_id: felt252,
        pub player: felt252,
        pub player_symbol: u8, // 1=X, 2=O
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct MoveMade {
        #[key]
        pub game_id: felt252,
        pub player: felt252,
        pub position: u8,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct GameCancelled {
        #[key]
        pub game_id: felt252,
        pub cancelled_by: felt252,
    }

    #[storage]
    struct Storage {
        verifier_address: ContractAddress,
    }

    #[abi(embed_v0)]
    impl TicTacToeImpl of ITicTacToe<ContractState> {
        fn set_verifier(ref self: ContractState, verifier_address: ContractAddress) {
            self.verifier_address.write(verifier_address);
        }
        fn create_game(
            ref self: ContractState,
            game_id: felt252,
            min_age_requirement: u8,
            user_id: felt252
        ) -> felt252 {
            let mut world = self.world_default();
            let caller = get_caller_address();

            // Verify age requirement using STARK verifier for creator
            let zero_address = contract_address_const::<0>();
            let verifier_addr = self.verifier_address.read();
            if verifier_addr != zero_address {
                let verifier = IStarkAgeVerifierDispatcher { contract_address: verifier_addr };
                let has_proof = verifier.has_valid_proof(user_id, min_age_requirement);
                if !has_proof { return 0; }
            }

            // Create game with empty board
            let game = TicTacToeGame {
                game_id,
                player_x: caller,
                player_o: zero_address,
                current_player: caller,
                board1: 0, board2: 0, board3: 0,
                board4: 0, board5: 0, board6: 0,
                board7: 0, board8: 0, board9: 0,
                winner: zero_address,
                is_draw: false,
                is_finished: false,
                min_age_requirement,
                created_at: starknet::get_block_timestamp(),
            };

            world.write_model(@game);
            world.emit_event(@GameCreated {
                game_id,
                creator: caller.into(),
                min_age_requirement,
            });

            game_id
        }

        fn join_game(ref self: ContractState, game_id: felt252, user_id: felt252) -> bool {
            let mut world = self.world_default();
            let caller = get_caller_address();

            // Read the game
            let mut game: TicTacToeGame = world.read_model(game_id);

            // Check if game is already full or finished
            let zero_address = contract_address_const::<0>();
            if game.player_o != zero_address || game.is_finished {
                return false;
            }

            // Verify age requirement using STARK verifier
            let verifier_addr = self.verifier_address.read();
            if verifier_addr != zero_address {
                let verifier = IStarkAgeVerifierDispatcher { contract_address: verifier_addr };
                let has_proof = verifier.has_valid_proof(user_id, game.min_age_requirement);
                if !has_proof {
                    return false;
                }
            }

            // Join as player O
            game.player_o = caller;
            world.write_model(@game);

            world.emit_event(@GameJoined {
                game_id,
                player: caller.into(),
                player_symbol: 2, // O
            });

            true
        }

        fn make_move(
            ref self: ContractState,
            game_id: felt252,
            position: u8,
            user_id: felt252
        ) -> bool {
            let mut world = self.world_default();
            let caller = get_caller_address();

            // Read the game
            let mut game: TicTacToeGame = world.read_model(game_id);

            // Check if game is finished
            if game.is_finished {
                return false;
            }

            // Check if it's the player's turn
            if caller != game.current_player {
                return false;
            }

            // Check if position is valid (1-9)
            if position < 1 || position > 9 {
                return false;
            }

            // Check if position is empty
            let is_position_empty = if position == 1 {
                game.board1 == 0
            } else if position == 2 {
                game.board2 == 0
            } else if position == 3 {
                game.board3 == 0
            } else if position == 4 {
                game.board4 == 0
            } else if position == 5 {
                game.board5 == 0
            } else if position == 6 {
                game.board6 == 0
            } else if position == 7 {
                game.board7 == 0
            } else if position == 8 {
                game.board8 == 0
            } else if position == 9 {
                game.board9 == 0
            } else {
                false
            };

            if !is_position_empty {
                return false;
            }

            // Verify identity and age requirement using STARK verifier
            let verifier_addr = self.verifier_address.read();
            let zero_address = contract_address_const::<0>();
            if verifier_addr != zero_address {
                let verifier = IStarkAgeVerifierDispatcher { contract_address: verifier_addr };
                let has_proof = verifier.has_valid_proof(user_id, game.min_age_requirement);
                if !has_proof {
                    return false;
                }
            }

            // Make the move
            let player_symbol = if caller == game.player_x { 1 } else { 2 };
            if position == 1 {
                game.board1 = player_symbol;
            } else if position == 2 {
                game.board2 = player_symbol;
            } else if position == 3 {
                game.board3 = player_symbol;
            } else if position == 4 {
                game.board4 = player_symbol;
            } else if position == 5 {
                game.board5 = player_symbol;
            } else if position == 6 {
                game.board6 = player_symbol;
            } else if position == 7 {
                game.board7 = player_symbol;
            } else if position == 8 {
                game.board8 = player_symbol;
            } else if position == 9 {
                game.board9 = player_symbol;
            } else {
                return false;
            }

            // Check win conditions for the current player
            let row1 = game.board1 == player_symbol && game.board2 == player_symbol && game.board3 == player_symbol;
            let row2 = game.board4 == player_symbol && game.board5 == player_symbol && game.board6 == player_symbol;
            let row3 = game.board7 == player_symbol && game.board8 == player_symbol && game.board9 == player_symbol;
            let col1 = game.board1 == player_symbol && game.board4 == player_symbol && game.board7 == player_symbol;
            let col2 = game.board2 == player_symbol && game.board5 == player_symbol && game.board8 == player_symbol;
            let col3 = game.board3 == player_symbol && game.board6 == player_symbol && game.board9 == player_symbol;
            let diag1 = game.board1 == player_symbol && game.board5 == player_symbol && game.board9 == player_symbol;
            let diag2 = game.board3 == player_symbol && game.board5 == player_symbol && game.board7 == player_symbol;

            let has_won = row1 || row2 || row3 || col1 || col2 || col3 || diag1 || diag2;

            // Check if the board is full (draw)
            let is_full = game.board1 != 0 && game.board2 != 0 && game.board3 != 0 &&
                game.board4 != 0 && game.board5 != 0 && game.board6 != 0 &&
                game.board7 != 0 && game.board8 != 0 && game.board9 != 0;

            if has_won {
                game.is_finished = true;
                game.winner = caller;
            } else if is_full {
                game.is_finished = true;
                game.is_draw = true;
            } else {
                // Switch players if game not finished
                game.current_player = if caller == game.player_x { game.player_o } else { game.player_x };
            }

            // Record the move
            let game_move = GameMove {
                game_id,
                move_number: 0, // Simplified
                player: caller,
                position,
                timestamp: starknet::get_block_timestamp(),
            };
            world.write_model(@game_move);

            // Update game state
            world.write_model(@game);
            world.emit_event(@MoveMade {
                game_id,
                player: caller.into(),
                position,
            });

            true
        }

        fn cancel_game(ref self: ContractState, game_id: felt252) -> bool {
            let mut world = self.world_default();
            let caller = get_caller_address();
            let zero_address = contract_address_const::<0>();

            let mut game: TicTacToeGame = world.read_model(game_id);

            // Only allow cancellation if:
            // 1. Game is NOT finished
            // 2. Game is still in waiting state
            if game.is_finished || game.player_o != zero_address {
                return false;
            }

            // Only allow game creator to cancel (no player O joined)
            if caller != game.player_x {
                return false;
            }

            game.is_finished = true;
            world.write_model(@game);
            world.emit_event(@GameCancelled {
                game_id,
                cancelled_by: caller.into(),
            });

            true
        }

        fn get_game(self: @ContractState, game_id: felt252) -> TicTacToeGame {
            let world = self.world_default();
            world.read_model(game_id)
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"dojo_starter")
        }
    }
}