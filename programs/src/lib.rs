#[cfg(not(feature = "no-entrypoint"))]
use solana_program::{
  account_info::{next_account_info, AccountInfo},
  entrypoint,
  entrypoint::ProgramResult,
  pubkey::Pubkey,
  program::invoke,
  program::invoke_signed,
  program_error::ProgramError,
  system_instruction,
  sysvar::{clock::Clock, rent::Rent, Sysvar},
};

use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct GameState {
  pub game_id: u64,
  pub initial_bid_amount: u64,
  pub highest_bid: u64,
  pub last_bid_time: u64,
  pub total_bids: u64,
  pub last_bidder: Pubkey,
  pub prize_pool: u64,
  pub game_end_time: u64,
  pub escrow_account: Pubkey,
  pub platform_fee_percentage: u64,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct PlayerState {
  pub total_bid_amount: u64,
  pub safe: bool,
  pub royalty_earned: u64,
  pub bid_count: u64,
  pub bid_number: u64,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Bid {
  pub bidder: Pubkey,
  pub amount: u64,
  pub timestamp: u64,
}

fn game_pda_seeds(game_id: u64, program_id: &Pubkey) -> (Pubkey, u8) {
  Pubkey::find_program_address(&[b"game", &game_id.to_le_bytes()], program_id)
}

fn bid_pda_seeds(game_id: u64, bid_number: u64, program_id: &Pubkey) -> (Pubkey, u8) {
  Pubkey::find_program_address(
      &[b"bid", &game_id.to_le_bytes(), &bid_number.to_le_bytes()],
      program_id
  )
}

fn player_pda_seeds<'a>(game_id: u64, player_pubkey: &'a Pubkey, program_id: &'a Pubkey) -> (Pubkey, u8) {
  Pubkey::find_program_address(&[b"player", &game_id.to_le_bytes(), player_pubkey.as_ref()], program_id)
}

entrypoint!(process_instruction);
pub fn process_instruction<'a>(
  program_id: &Pubkey,
  accounts: &'a [AccountInfo<'a>],  
  instruction_data: &[u8],
) -> ProgramResult {
  let instruction = instruction_data[0];
  match instruction {
      0 => create_game(program_id, accounts, instruction_data),  
      1 => place_bid(program_id, accounts, instruction_data), 
      2 => end_game(program_id, accounts),  
      _ => Err(ProgramError::InvalidInstructionData),
  }
}

fn create_game<'a>(
  program_id: &Pubkey,
  accounts: &'a [AccountInfo<'a>],
  instruction_data: &[u8],
) -> ProgramResult {
  let accounts_iter = &mut accounts.iter();
  let game_account = next_account_info(accounts_iter)?; 
  let payer_account = next_account_info(accounts_iter)?;
  let system_program = next_account_info(accounts_iter)?;

  let game_id = u64::from_le_bytes(instruction_data[1..9].try_into().unwrap());
  let game_end_time = u64::from_le_bytes(instruction_data[9..17].try_into().unwrap());
  let initial_bid_amount = u64::from_le_bytes(instruction_data[17..25].try_into().unwrap());

  let (game_pda, bump_seed) = game_pda_seeds(game_id, program_id);
  if *game_account.key != game_pda {
      return Err(ProgramError::InvalidAccountData);
  }

  let rent = Rent::get()?;
  let rent_required = rent.minimum_balance(std::mem::size_of::<GameState>());

  invoke_signed(
      &system_instruction::create_account(
          payer_account.key,
          game_account.key,
          rent_required,
          std::mem::size_of::<GameState>() as u64,
          program_id,
      ),
      &[payer_account.clone(), game_account.clone(), system_program.clone()],
      &[&[b"game", &game_id.to_le_bytes(), &[bump_seed]]],
  )?;

  let game_state = GameState {
      game_id,
      initial_bid_amount,
      highest_bid: initial_bid_amount,
      last_bid_time: Clock::get()?.unix_timestamp as u64,
      total_bids: 1,
      last_bidder: *payer_account.key,
      prize_pool: initial_bid_amount,
      game_end_time,
      escrow_account: Pubkey::default(),
      platform_fee_percentage: 10,
  };

  game_state.serialize(&mut &mut game_account.data.borrow_mut()[..])?;

  initialize_player_state(program_id, accounts, payer_account, initial_bid_amount, game_id)?;

  Ok(())
}

fn initialize_player_state<'a>(
  program_id: &Pubkey,
  accounts: &'a [AccountInfo<'a>],
  payer_account: &'a AccountInfo<'a>,
  initial_bid_amount: u64,
  game_id: u64,
) -> ProgramResult {
  let (player_pda, bump_seed) = player_pda_seeds(game_id, payer_account.key, program_id);

  let player_account = next_account_info(&mut accounts.iter())?;
  let system_program = next_account_info(&mut accounts.iter())?;

  if *player_account.key != player_pda {
      return Err(ProgramError::InvalidAccountData);
  }

  let rent = Rent::get()?;
  let rent_required = rent.minimum_balance(std::mem::size_of::<PlayerState>());

  invoke_signed(
    &system_instruction::create_account(
        payer_account.key,
        player_account.key,
        rent_required,
        std::mem::size_of::<PlayerState>() as u64,
        program_id,
    ),
    &[payer_account.clone(), player_account.clone(), system_program.clone()],
    &[&[b"player", &game_id.to_le_bytes(), payer_account.key.as_ref(), &[bump_seed]]],
  )?;

  let player_state = PlayerState {
      total_bid_amount: initial_bid_amount,
      safe: false,
      royalty_earned: 0,
      bid_count: 1,
      bid_number: 1,
  };

  player_state.serialize(&mut &mut player_account.data.borrow_mut()[..])?;

  Ok(())
}

fn place_bid<'a, 'b: 'a>(
  program_id: &Pubkey,
  accounts: &'a [AccountInfo<'b>],
  instruction_data: &[u8],
)  -> ProgramResult {
  let accounts_iter = &mut accounts.iter();
  let bidder_account = next_account_info(accounts_iter)?;
  let game_account = next_account_info(accounts_iter)?;
  let player_account = next_account_info(accounts_iter)?;
  let system_program = next_account_info(accounts_iter)?;
  let bid_account = next_account_info(accounts_iter)?;

  let bid_amount = u64::from_le_bytes(instruction_data[1..9].try_into().unwrap());
  let mut game_state: GameState = GameState::try_from_slice(&game_account.data.borrow())?;
  let mut player_state: PlayerState = PlayerState::try_from_slice(&player_account.data.borrow())?;

  if bid_amount < 2 * game_state.highest_bid || bid_amount < 100000000 {
      return Err(ProgramError::InvalidArgument);
  }

  game_state.highest_bid = bid_amount;
  game_state.last_bidder = *bidder_account.key;
  game_state.last_bid_time = Clock::get()?.unix_timestamp as u64;
  game_state.total_bids += 1;
  game_state.prize_pool += bid_amount;

  player_state.total_bid_amount += bid_amount;
  player_state.bid_count += 1;
  player_state.bid_number = game_state.total_bids;

  let (bid_pda, bid_bump) = bid_pda_seeds(game_state.game_id, game_state.total_bids, program_id);
  if bid_pda != *bid_account.key {
      return Err(ProgramError::InvalidAccountData);
  }

  let rent = Rent::get()?;
  let bid_account_len = std::mem::size_of::<Bid>();
  let lamports = rent.minimum_balance(bid_account_len);

  invoke_signed(
      &system_instruction::create_account(
          bidder_account.key,
          bid_account.key,
          lamports,
          bid_account_len as u64,
          program_id,
      ),
      &[bidder_account.clone(), bid_account.clone(), system_program.clone()],
      &[&[b"bid", &game_state.game_id.to_le_bytes(), &game_state.total_bids.to_le_bytes(), &[bid_bump]]],
  )?;

  let bid = Bid {
      bidder: *bidder_account.key,
      amount: bid_amount,
      timestamp: Clock::get()?.unix_timestamp as u64,
  };
  bid.serialize(&mut &mut bid_account.data.borrow_mut()[..])?;

  game_state.serialize(&mut &mut game_account.data.borrow_mut()[..])?;
  player_state.serialize(&mut &mut player_account.data.borrow_mut()[..])?;

  invoke(
      &system_instruction::transfer(
          bidder_account.key,
          game_account.key,
          bid_amount,
      ),
      &[bidder_account.clone(), game_account.clone(), system_program.clone()],
  )?;

  Ok(())
}

fn end_game<'a, 'b: 'a>(
  program_id: &Pubkey,
  accounts: &'a [AccountInfo<'b>],
) -> ProgramResult {
  let accounts_iter = &mut accounts.iter();
  let game_account = next_account_info(accounts_iter)?;
  let platform_fee_account = next_account_info(accounts_iter)?;
  let system_program = next_account_info(accounts_iter)?;

  let game_state: GameState = GameState::try_from_slice(&game_account.data.borrow())?;

  if Clock::get()?.unix_timestamp as u64 <= game_state.game_end_time {
      return Err(ProgramError::InvalidAccountData);
  }

  let bid_history: Vec<Bid> = fetch_bid_history(program_id, game_state.game_id, game_state.total_bids, accounts)?;

  if bid_history.len() < 5 {
      return Err(ProgramError::InvalidInstructionData);
  }

  let last_5_bids: Vec<u64> = bid_history.iter().rev().take(5).map(|bid| bid.amount).collect();
  let platform_fee = last_5_bids.iter().sum::<u64>() * game_state.platform_fee_percentage / 100;

  let royalty_amount = bid_history[bid_history.len() - 4].amount;
  cal_royalties(program_id, &bid_history, royalty_amount, game_account, accounts)?;

  let remaining_prize = game_state.prize_pool - platform_fee;

  let last_bid = bid_history.last().ok_or(ProgramError::InvalidAccountData)?;
  let winner_account = find_bidder_account(&last_bid.bidder, accounts)?;

  invoke(
      &system_instruction::transfer(
          game_account.key,
          platform_fee_account.key,
          platform_fee,
      ),
      &[game_account.clone(), platform_fee_account.clone(), system_program.clone()],
  )?;

  invoke(
      &system_instruction::transfer(
          game_account.key,
          winner_account.key,
          remaining_prize,
      ),
      &[game_account.clone(), winner_account.clone(), system_program.clone()],
  )?;
  Ok(())
}


fn cal_royalties<'a, 'b: 'a>(
  program_id: &Pubkey,
  bid_history: &[Bid],
  royalty_amount: u64,
  game_account: &'a AccountInfo<'b>,
  accounts: &'a [AccountInfo<'b>],
) -> ProgramResult {
  let eligible_bidders = &bid_history[0..bid_history.len() - 5];
  let total_bidders = eligible_bidders.len();

  let mut remaining_royalty = royalty_amount;
  
  for (i, bid) in eligible_bidders.iter().enumerate() {
      let royalty_share = (remaining_royalty * (total_bidders as u64 - i as u64)) / total_bidders as u64;
      let total_share = bid.amount + royalty_share;

      transfer_royalty(program_id, bid.bidder, total_share, game_account, accounts)?;
      remaining_royalty -= royalty_share;
  }

  Ok(())
}

fn transfer_royalty<'a, 'b: 'a>(
  _program_id: &Pubkey,
  bidder: Pubkey,
  amount: u64,
  game_account: &'a AccountInfo<'b>,
  accounts: &'a [AccountInfo<'b>],
) -> ProgramResult {
  let bidder_account = find_bidder_account(&bidder, accounts)?;
  let system_program = find_system_program(accounts)?;

  invoke(
      &system_instruction::transfer(
          game_account.key,
          bidder_account.key,
          amount,
      ),
      &[game_account.clone(), bidder_account.clone(), system_program.clone()],
  )?;

  Ok(())
}

fn find_bidder_account<'a, 'b: 'a>(bidder_pubkey: &Pubkey, accounts: &'a [AccountInfo<'b>]) -> Result<&'a AccountInfo<'b>, ProgramError> {
  accounts.iter().find(|account| account.key == bidder_pubkey)
      .ok_or(ProgramError::InvalidAccountData)
}

fn find_system_program<'a, 'b: 'a>(accounts: &'a [AccountInfo<'b>]) -> Result<&'a AccountInfo<'b>, ProgramError> {
  accounts.iter().find(|account| account.key == &solana_program::system_program::ID)
      .ok_or(ProgramError::InvalidAccountData)
}

fn fetch_bid_history<'a, 'b: 'a>(
  program_id: &Pubkey,
  game_id: u64,
  total_bids: u64,
  accounts: &'a [AccountInfo<'b>],
)  -> Result<Vec<Bid>, ProgramError> {
  let mut bid_history = Vec::new();
  for bid_number in 1..=total_bids {
      let (bid_pda, _) = bid_pda_seeds(game_id, bid_number, program_id);
      if let Some(bid_account) = accounts.iter().find(|account| account.key == &bid_pda) {
          let bid = Bid::try_from_slice(&bid_account.data.borrow())?;
          bid_history.push(bid);
      } else {
          return Err(ProgramError::InvalidAccountData);
      }
  }
  Ok(bid_history)
}