use dojo_starter::models::{TicTacToeGame, GameMove, AgeVerification};

#[starknet::interface]
pub trait ITicTacToe<T> {
    fn create_game(ref self: T, game_id: felt252, min_age_requirement: u8) -> felt252;
    fn join_game(ref self: T, game_id: felt252, user_id: felt252) -> bool;
    fn make_move(ref self: T, game_id: felt252, position: u8, user_id: felt252) -> bool;
    fn get_game(self: @T, game_id: felt252) -> TicTacToeGame;
}

#[dojo::contract]
pub mod tictactoe {
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use dojo_starter::models::{TicTacToeGame, GameMove, AgeVerification};
    use starknet::get_caller_address;
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

    #[abi(embed_v0)]
    impl TicTacToeImpl of ITicTacToe<ContractState> {
        fn create_game(
            ref self: ContractState,
            game_id: felt252,
            min_age_requirement: u8
        ) -> felt252 {
            let mut world = self.world_default();
            let caller = get_caller_address();

            // Create game with empty board
            let zero_address = starknet::contract_address_const::<0>();
            let game = TicTacToeGame {
                game_id,
                player_x: caller,
                player_o: zero_address, // Will be set when someone joins
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
            let zero_address = starknet::contract_address_const::<0>();
            if game.player_o != zero_address || game.is_finished {
                return false;
            }

            // Verify age requirement
            let verification: AgeVerification = world.read_model(user_id);
            if !verification.verified || verification.minimum_age < game.min_age_requirement {
                return false;
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

            // Verify identity and age requirement
            let verification: AgeVerification = world.read_model(user_id);
            if !verification.verified || verification.minimum_age < game.min_age_requirement {
                return false;
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

            // Switch players
            game.current_player = if caller == game.player_x { game.player_o } else { game.player_x };

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