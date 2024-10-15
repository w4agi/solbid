use solana_program::{
  account_info::{next_account_info, AccountInfo},
  entrypoint::ProgramResult,
  pubkey::Pubkey,
  program::invoke_signed,
  program::invoke,
  system_instruction,
  sysvar::{clock::Clock, rent::Rent, Sysvar},
};
use borsh::BorshSerialize;
use crate::state::{
  GameState, 
  PlayerState, 
  Bid, 
  GAME_ACCOUNT_SIZE, 
  PLAYER_ACCOUNT_SIZE, 
  BID_ACCOUNT_SIZE
};
use crate::error::BiddingError;
use crate::utils::{game_pda_seeds, player_pda_seeds, bid_pda_seeds};

pub fn create_game(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    game_id: u64,
    initial_bid_amount: u64,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let game_account = next_account_info(accounts_iter)?;
    let payer_account = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;
    let player_account = next_account_info(accounts_iter)?;
    let bid_account = next_account_info(accounts_iter)?;

    if initial_bid_amount < 14_000_000 {
      return Err(BiddingError::InsufficientInitialBid.into());
    }
    let (game_pda, game_bump) = game_pda_seeds(
      game_id, 
      program_id
    );
    if *game_account.key != game_pda {
      return Err(BiddingError::InvalidGameAccount.into());
    }
    let (player_pda, player_bump) = player_pda_seeds(
      game_id, 
      payer_account.key, 
      1, 
      program_id
    );
    if *player_account.key != player_pda {
        return Err(BiddingError::InvalidPlayerAccount.into());
    }
    let (bid_pda, bid_bump) = bid_pda_seeds(
      game_id, 
      1, 
      program_id
    );
    if *bid_account.key != bid_pda {
      return Err(BiddingError::InvalidBidAccount.into());
    }

    let rent = Rent::get()?;
    let game_rent = rent.minimum_balance(std::mem::size_of::<GameState>());
    let player_rent = rent.minimum_balance(std::mem::size_of::<PlayerState>());
    let bid_rent = rent.minimum_balance(std::mem::size_of::<Bid>());
 
    invoke_signed(
      &system_instruction::create_account(
        payer_account.key,
        game_account.key,
        game_rent,
        GAME_ACCOUNT_SIZE as u64,
        program_id,
      ),
      &[payer_account.clone(), game_account.clone(), system_program.clone()],
      &[&[b"game", &game_id.to_le_bytes(), &[game_bump]]],
    )?;
  
    invoke_signed(
      &system_instruction::create_account(
        payer_account.key,
        player_account.key,
        player_rent,
        PLAYER_ACCOUNT_SIZE as u64,
        program_id,
      ),
      &[payer_account.clone(), player_account.clone(), system_program.clone()],
      &[&[b"player", &game_id.to_le_bytes(), payer_account.key.as_ref(), &1u64.to_le_bytes(), &[player_bump]]],
    )?;
    
    invoke_signed(
        &system_instruction::create_account(
            payer_account.key,
            bid_account.key,
            bid_rent,
            BID_ACCOUNT_SIZE as u64,
            program_id,
        ),
        &[payer_account.clone(), bid_account.clone(), system_program.clone()],
        &[&[b"bid", &game_id.to_le_bytes(), &1u64.to_le_bytes(), &[bid_bump]]],
    )?;
  
    let current_time = Clock::get()?.unix_timestamp as u64;

    let game_state = GameState {
        game_id,
        initial_bid_amount,
        highest_bid: initial_bid_amount,
        last_bid_time: current_time,
        total_bids: 1,
        last_bidder: *payer_account.key,
        prize_pool: initial_bid_amount,
        platform_fee_percentage: 10,
        game_ended: false,
    };
 
    let player_state = PlayerState {
        total_bid_amount: initial_bid_amount,
        safe: false,
        royalty_earned: 0,
        bid_count: 1,
    };
  
    let bid = Bid {
        bidder: *payer_account.key,
        amount: initial_bid_amount,
        timestamp: current_time,
    };
  
    game_state.serialize(&mut &mut game_account.data.borrow_mut()[..])?;
    player_state.serialize(&mut &mut player_account.data.borrow_mut()[..])?;
    bid.serialize(&mut &mut bid_account.data.borrow_mut()[..])?;
 
    invoke(
      &system_instruction::transfer(
          payer_account.key,
          game_account.key,
          initial_bid_amount,
      ),
      &[payer_account.clone(), game_account.clone(), system_program.clone()],
    )?;
 
    Ok(())
}