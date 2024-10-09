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

const PLATFORM_ACCOUNT: Pubkey = Pubkey::new_from_array([
  96,  79, 195, 243,  84, 122, 225,  37,
  188,  82,  48, 199, 203, 152, 132,  24,
  130, 124, 179, 155, 233, 233,   1, 181,
  197, 137,  55, 202,  46,  23, 188,  95
]);

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

fn game_pda_seeds(game_id: u64, program_id: &Pubkey) -> (Pubkey, u8) {
  Pubkey::find_program_address(&[b"game", &game_id.to_le_bytes()], program_id)
}

fn bid_pda_seeds(game_id: u64, bid_number: u64, program_id: &Pubkey) -> (Pubkey, u8) {
  Pubkey::find_program_address(
      &[b"bid", &game_id.to_le_bytes(), &bid_number.to_le_bytes()],
      program_id,
  )
}

fn player_pda_seeds(
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

entrypoint!(process_instruction);
pub fn process_instruction(
  program_id: &Pubkey,
  accounts: &[AccountInfo],
  instruction_data: &[u8],
) -> ProgramResult {
  let instruction = instruction_data[0];
  match instruction {
      0 => create_game(program_id, accounts, instruction_data),
      1 => place_bid(program_id, accounts, instruction_data),
      _ => Err(ProgramError::InvalidInstructionData.into()),
  }
}

fn create_game(
  program_id: &Pubkey,
  accounts: &[AccountInfo],
  instruction_data: &[u8],
) -> ProgramResult {
  let accounts_iter = &mut accounts.iter();
  let game_account = next_account_info(accounts_iter)?;
  let payer_account = next_account_info(accounts_iter)?;
  let system_program = next_account_info(accounts_iter)?;
  let player_account = next_account_info(accounts_iter)?;
  let bid_account = next_account_info(accounts_iter)?;

  let game_id = u64::from_le_bytes(instruction_data[1..9].try_into().unwrap());
  let initial_bid_amount = u64::from_le_bytes(instruction_data[9..17].try_into().unwrap());

  if initial_bid_amount < 14_000_000 {
      return Err(ProgramError::Custom(1).into());
  }

  let (game_pda, game_bump) = game_pda_seeds(game_id, program_id);
  if *game_account.key != game_pda {
      return Err(ProgramError::Custom(2).into());
  }

  let (player_pda, player_bump) = player_pda_seeds(game_id, payer_account.key, 1, program_id);
  if *player_account.key != player_pda {
      return Err(ProgramError::Custom(3).into());
  }

  let (bid_pda, bid_bump) = bid_pda_seeds(game_id, 1, program_id);
  if *bid_account.key != bid_pda {
      return Err(ProgramError::Custom(4).into());
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
          std::mem::size_of::<GameState>() as u64,
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
          std::mem::size_of::<PlayerState>() as u64,
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
          std::mem::size_of::<Bid>() as u64,
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

fn place_bid(
  program_id: &Pubkey,
  accounts: &[AccountInfo],
  instruction_data: &[u8],
) -> ProgramResult {
  let accounts_iter = &mut accounts.iter();
  let bidder_account = next_account_info(accounts_iter)?;
  let game_account = next_account_info(accounts_iter)?;
  let system_program = next_account_info(accounts_iter)?;

  let bid_amount = u64::from_le_bytes(instruction_data[1..9].try_into().unwrap());
  let mut game_state: GameState = GameState::try_from_slice(&game_account.data.borrow())?;

  if game_state.game_ended {
      return Err(ProgramError::Custom(5).into());
  }

  let current_time = Clock::get()?.unix_timestamp as u64;

  if current_time - game_state.last_bid_time > 120 {
      return end_game(program_id, accounts, &mut game_state);
  }

  if bid_amount < 2 * game_state.highest_bid {
      return Err(ProgramError::Custom(6).into());
  }
 
  let new_bid_count = game_state.total_bids + 1;

  let (new_player_pda, new_player_bump) = player_pda_seeds(game_state.game_id, bidder_account.key, new_bid_count, program_id);
  let new_player_account = next_account_info(accounts_iter)?;
  if *new_player_account.key != new_player_pda {
      return Err(ProgramError::Custom(7).into());
  }

  let (new_bid_pda, new_bid_bump) = bid_pda_seeds(game_state.game_id, new_bid_count, program_id);
  let new_bid_account = next_account_info(accounts_iter)?;
  if *new_bid_account.key != new_bid_pda {
      return Err(ProgramError::Custom(8).into());
  }

  let rent = Rent::get()?;
  let player_rent = rent.minimum_balance(std::mem::size_of::<PlayerState>());
  let bid_rent = rent.minimum_balance(std::mem::size_of::<Bid>());

  invoke_signed(
      &system_instruction::create_account(
          bidder_account.key,
          new_player_account.key,
          player_rent,
          std::mem::size_of::<PlayerState>() as u64,
          program_id,
      ),
      &[bidder_account.clone(), new_player_account.clone(), system_program.clone()],
      &[&[b"player", &game_state.game_id.to_le_bytes(), bidder_account.key.as_ref(), &new_bid_count.to_le_bytes(), &[new_player_bump]]],
  )?;

  invoke_signed(
      &system_instruction::create_account(
          bidder_account.key,
          new_bid_account.key,
          bid_rent,
          std::mem::size_of::<Bid>() as u64,
          program_id,
      ),
      &[bidder_account.clone(), new_bid_account.clone(), system_program.clone()],
      &[&[b"bid", &game_state.game_id.to_le_bytes(), &new_bid_count.to_le_bytes(), &[new_bid_bump]]],
  )?;

  game_state.highest_bid = bid_amount;
  game_state.last_bid_time = current_time;
  game_state.last_bidder = *bidder_account.key;
  game_state.total_bids = new_bid_count;
  game_state.prize_pool += bid_amount;

  game_state.serialize(&mut &mut game_account.data.borrow_mut()[..])?;

  let new_player_state = PlayerState {
      total_bid_amount: bid_amount,
      safe: false,
      royalty_earned: 0,
      bid_count: new_bid_count,
  };

  new_player_state.serialize(&mut &mut new_player_account.data.borrow_mut()[..])?;

  let new_bid = Bid {
      bidder: *bidder_account.key,
      amount: bid_amount,
      timestamp: current_time,
  };

  new_bid.serialize(&mut &mut new_bid_account.data.borrow_mut()[..])?;

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
  game_state: &mut GameState,
) -> ProgramResult {
  let accounts_iter = &mut accounts.iter();
  let game_account = next_account_info(accounts_iter)?;
  let system_program = next_account_info(accounts_iter)?;

  
  let bid_history: Vec<Bid> = fetch_bid_history(program_id, game_state.game_id, game_state.total_bids, accounts)?;
  
  if bid_history.len() < 5 {
      let total_amount = game_state.prize_pool;
      let platform_fee = total_amount * 10 / 100;
      let remaining_prize = total_amount - platform_fee;

      let last_bid = bid_history.last().ok_or(ProgramError::Custom(9))?;
      let winner_account = find_bidder_account(&last_bid.bidder, accounts)?;

      invoke(
          &system_instruction::transfer(
              game_account.key,
              &PLATFORM_ACCOUNT,
              platform_fee,
          ),
          &[game_account.clone(), system_program.clone()],
      )?;

      invoke(
          &system_instruction::transfer(
              game_account.key,
              winner_account.key,
              remaining_prize,
          ),
          &[game_account.clone(), winner_account.clone(), system_program.clone()],
      )?;

      game_state.game_ended = true;
      return Ok(());
    }

      let last_5_bids: Vec<u64> = bid_history.iter().rev().take(5).map(|bid| bid.amount).collect();
      let platform_fee = last_5_bids.iter().sum::<u64>() * game_state.platform_fee_percentage / 100;

      let royalty_amount = bid_history[bid_history.len() - 4].amount;
      cal_royalties(program_id, &bid_history, royalty_amount, game_account, accounts)?;

      let remaining_prize = game_state.prize_pool - platform_fee;

      let last_bid = bid_history.last().ok_or(ProgramError::Custom(10))?;
      let winner_account = find_bidder_account(&last_bid.bidder, accounts)?;

      invoke(
          &system_instruction::transfer(
            game_account.key,
            &PLATFORM_ACCOUNT,
            platform_fee,
          ),
          &[game_account.clone(), system_program.clone()],
      )?;

      invoke(
          &system_instruction::transfer(
            game_account.key,
            winner_account.key,
            remaining_prize,
          ),
          &[game_account.clone(), winner_account.clone(), system_program.clone()],
      )?;

      game_state.game_ended = true;
      game_state.serialize(&mut &mut game_account.data.borrow_mut()[..])?;

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

  let mut total_weight = 0;
  let mut total_bid_amount = 0;
  for (i, bid) in eligible_bidders.iter().enumerate() {
      total_weight += total_bidders as u64 - i as u64; 
      total_bid_amount += bid.amount; 
  }

  let mut remaining_royalty = royalty_amount;
  
  for (i, bid) in eligible_bidders.iter().enumerate() {
      let weight = total_bidders as u64 - i as u64;
      let share = (weight * bid.amount) as u64;
      
      let royalty_share = (share * royalty_amount) / (total_weight * total_bid_amount);
      let total_share = bid.amount + royalty_share;

      transfer_royalty(program_id, bid.bidder, total_share, game_account, accounts)?;

      let player_account = find_bidder_account(&bid.bidder, accounts)?;
      let mut player_state: PlayerState = PlayerState::try_from_slice(&player_account.data.borrow())?;

      player_state.royalty_earned += royalty_share; 
      player_state.safe = true; 
      player_state.serialize(&mut &mut player_account.data.borrow_mut()[..])?;
      remaining_royalty = remaining_royalty.saturating_sub(royalty_share);
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
        .ok_or(ProgramError::Custom(11))
}

fn find_system_program<'a, 'b: 'a>(accounts: &'a [AccountInfo<'b>]) -> Result<&'a AccountInfo<'b>, ProgramError> {
    accounts.iter().find(|account| account.key == &solana_program::system_program::ID)
        .ok_or(ProgramError::Custom(12))
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
            return Err(ProgramError::Custom(13));
        }
    }
    Ok(bid_history)
}

pub fn map_error_code(error_code: u32) -> String {
    match error_code {
        1 => "Initial bid amount must be at least 2 USDC".to_string(),
        2 => "Invalid game account".to_string(),
        3 => "Invalid player account".to_string(),
        4 => "Invalid bid account".to_string(),
        5 => "Game has already ended".to_string(),
        6 => "Bid amount must be at least double the highest bid".to_string(),
        7 => "Invalid new player account".to_string(),
        8 => "Invalid new bid account".to_string(),
        9 => "No bids found in game".to_string(),
        10 => "No winner found".to_string(),
        11 => "Bidder account not found".to_string(),
        12 => "System program account not found".to_string(),
        13 => "Failed to fetch bid history".to_string(),
        _ => format!("Unknown error: {}", error_code),
    }
}