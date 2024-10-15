use borsh::BorshDeserialize;
use solana_program::{
  account_info::AccountInfo,
  entrypoint::ProgramResult,
  program_error::ProgramError,
  pubkey::Pubkey,
};
use std::collections::HashMap;

use crate::state::{Bid, GameState, PlayerState};
use crate::error::BiddingError;

pub fn game_pda_seeds(game_id: u64, program_id: &Pubkey) -> (Pubkey, u8) {
  Pubkey::find_program_address(&[b"game", &game_id.to_le_bytes()], program_id)
}

pub fn bid_pda_seeds(game_id: u64, bid_number: u64, program_id: &Pubkey) -> (Pubkey, u8) {
  Pubkey::find_program_address(
    &[b"bid", &game_id.to_le_bytes(), &bid_number.to_le_bytes()],
    program_id,
  )
}

pub fn player_pda_seeds(
  game_id: u64,
  player_pubkey: &Pubkey,
  bid_count: u64,
  program_id: &Pubkey,
) -> (Pubkey, u8) {
  Pubkey::find_program_address(
    &[b"player", &game_id.to_le_bytes(), player_pubkey.as_ref(), &bid_count.to_le_bytes()],
    program_id,
  )
}

pub fn find_account<'a, 'b: 'a>(bidder_pubkey: &Pubkey, accounts: &'a [AccountInfo<'b>]) -> Result<&'a AccountInfo<'b>, BiddingError> {
  for account in accounts {
    if account.key == bidder_pubkey {
      return Ok(account);
    }
  }

  Err(BiddingError::AccountNotFound)
}

pub fn fetch_bid_history<'a, 'b: 'a>(
  program_id: &Pubkey,
  game_id: u64,
  total_bids: u64,  
  accounts: &'a [AccountInfo<'b>],
) -> Result<Vec<Bid>, BiddingError> {
  let mut account_map: HashMap<Pubkey, &AccountInfo<'b>> = HashMap::new();

  for account_info in accounts {
      account_map.insert(*account_info.key, account_info);
  }

  let mut bid_history = Vec::with_capacity(total_bids as usize);

  for bid_number in 1..=total_bids {
    let (bid_pda, _) = bid_pda_seeds(game_id, bid_number, program_id);

    match account_map.get(&bid_pda) {
      Some(account_info) => {
        if account_info.data.borrow().is_empty() {
          return Err(BiddingError::BidAccountNotInitialized);
        }

        let bid_data = Bid::try_from_slice(&account_info.data.borrow())
          .map_err(|_| BiddingError::FailedToDeserializeBidData)?;

        bid_history.push(bid_data);
      },
      None => {
        return Err(BiddingError::BidAccountNotFound);
      },
    }
  }

  Ok(bid_history)
}

pub fn transfer_from_pda<'a>(
  from_account: &AccountInfo<'a>,
  to_account: &AccountInfo<'a>,
  amount: u64,
) -> ProgramResult {
  if **from_account.try_borrow_lamports()? < amount {
      return Err(BiddingError::InsufficientFunds.into());
  }

  **from_account.try_borrow_mut_lamports()? -= amount;
  **to_account.try_borrow_mut_lamports()? += amount;
  Ok(())
}

 
pub fn deserialize_game_state(account_data: &[u8]) -> Result<GameState, ProgramError> {
  if account_data.len() != std::mem::size_of::<GameState>() {
      return Err(ProgramError::InvalidAccountData);
  }

  let game_id = u64::from_le_bytes(account_data[..std::mem::size_of::<u64>()].try_into().unwrap());
  let initial_bid_amount = u64::from_le_bytes(account_data[std::mem::size_of::<u64>()..std::mem::size_of::<u64>() * 2].try_into().unwrap());
  let highest_bid = u64::from_le_bytes(account_data[std::mem::size_of::<u64>() * 2..std::mem::size_of::<u64>() * 3].try_into().unwrap());
  let last_bid_time = u64::from_le_bytes(account_data[std::mem::size_of::<u64>() * 3..std::mem::size_of::<u64>() * 4].try_into().unwrap());
  let total_bids = u64::from_le_bytes(account_data[std::mem::size_of::<u64>() * 4..std::mem::size_of::<u64>() * 5].try_into().unwrap());

  let last_bidder_slice = &account_data[std::mem::size_of::<u64>() * 5..std::mem::size_of::<u64>() * 5 + std::mem::size_of::<Pubkey>()];
  let last_bidder = Pubkey::new_from_array(last_bidder_slice.try_into().map_err(|_| ProgramError::InvalidAccountData)?);

  let prize_pool = u64::from_le_bytes(account_data[std::mem::size_of::<u64>() * 5 + std::mem::size_of::<Pubkey>()..std::mem::size_of::<u64>() * 6 + std::mem::size_of::<Pubkey>()].try_into().unwrap());
  let platform_fee_percentage = u64::from_le_bytes(account_data[std::mem::size_of::<u64>() * 6 + std::mem::size_of::<Pubkey>()..std::mem::size_of::<u64>() * 7 + std::mem::size_of::<Pubkey>()].try_into().unwrap());
  let game_ended = account_data[std::mem::size_of::<u64>() * 7 + std::mem::size_of::<Pubkey>()] != 0;

  Ok(GameState {
    game_id,
    initial_bid_amount,
    highest_bid,
    last_bid_time,
    total_bids,
    last_bidder,
    prize_pool,
    platform_fee_percentage,
    game_ended,
  })
}

pub fn deserialize_player_state(account_data: &[u8]) -> Result<PlayerState, ProgramError> {
  if account_data.len() < std::mem::size_of::<PlayerState>() {
    return Err(ProgramError::AccountDataTooSmall);
  }

  let total_bid_amount = u64::from_le_bytes(account_data[..std::mem::size_of::<u64>()].try_into().unwrap());
  let safe = account_data[std::mem::size_of::<u64>()] != 0;
  let royalty_earned = u64::from_le_bytes(account_data[std::mem::size_of::<u64>() + 1..std::mem::size_of::<u64>() + 9].try_into().unwrap());
  let bid_count = u64::from_le_bytes(account_data[std::mem::size_of::<u64>() + 9..std::mem::size_of::<u64>() + 17].try_into().unwrap());

  Ok(PlayerState {
    total_bid_amount,
    safe,
    royalty_earned,
    bid_count,
  })
}