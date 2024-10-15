use borsh::{BorshDeserialize, BorshSerialize};

pub mod create_game;
pub mod place_bid;

pub use create_game::*;
pub use place_bid::*;

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum BiddingInstruction {
    CreateGame {
        game_id: u64,
        initial_bid_amount: u64,
    },
    PlaceBid {
        bid_amount: u64,
        bid_count:u64,
    },
}