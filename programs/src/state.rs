use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct GameState {
  pub game_id: u64,
  pub initial_bid_amount: u64,
  pub highest_bid: u64,
  pub last_bid_time: u64,
  pub total_bids: u64,
  pub last_bidder: Pubkey,
  pub prize_pool: u64,
  pub platform_fee_percentage: u64,
  pub game_ended: bool,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct PlayerState {
  pub total_bid_amount: u64,
  pub safe: bool,
  pub royalty_earned: u64,
  pub bid_count: u64,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Bid {
  pub bidder: Pubkey,
  pub amount: u64,
  pub timestamp: u64,
}

pub const GAME_ACCOUNT_SIZE: usize = 96;
pub const PLAYER_ACCOUNT_SIZE: usize = 32;
pub const BID_ACCOUNT_SIZE: usize = 48;