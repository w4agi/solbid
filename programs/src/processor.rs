use borsh::BorshDeserialize;
use solana_program::{
  account_info::AccountInfo,
  entrypoint::ProgramResult,
  pubkey::Pubkey,
};

use crate::instructions::{BiddingInstruction, create_game, place_bid};
use crate::error::BiddingError;

pub fn process_instruction(
  program_id: &Pubkey,
  accounts: &[AccountInfo],
  instruction_data: &[u8],
) -> ProgramResult {
  let instruction = BiddingInstruction::try_from_slice(instruction_data)
    .map_err(|_| BiddingError::InvalidInstruction)?;

  match instruction {
    BiddingInstruction::CreateGame { game_id, initial_bid_amount } => {
      create_game(program_id, accounts, game_id, initial_bid_amount)
    },
    BiddingInstruction::PlaceBid { bid_amount , bid_count} => {
      place_bid(program_id, accounts, bid_amount, bid_count)
    },
  }
}