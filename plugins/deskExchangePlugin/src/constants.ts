export enum GAME_WORKER_FUNCTION_NAME {
  GET_ACCOUNT_SUMMARY = 'get_account_summary',
  CANCEL_ORDERS = 'cancel_orders',
  PERP_TRADE = 'perp_trade',
}

export const GAME_WORKER_FUNCTIONS: Array<string> = Object.values(GAME_WORKER_FUNCTION_NAME)

export enum FMT_ERRORS {
  SOMETHING_WENT_WRONG = 'Something went wrong: {{error}}',
  FAILED_TO_GET_ACCOUNT_SUMMARY = 'Failed to get account summary: {{error}}',
  FAILED_TO_CANCEL_ORDERS = 'Failed to cancel orders: {{error}}',
  FAILED_TO_PERP_TRADE = 'Failed to perp trade: {{error}}',
}

// NOTE: these messages are used in the feedback of the executable game function
// also use to compare in tests
export enum SUCCESS_MESSAGES {
  // get account summary
  ACCOUNT_SUMMARY = 'Here is the summary of your account:',
  YOUR_POSITIONS = 'Your positions:',
  YOUR_ORDERS = 'Your orders:',
  YOUR_COLLATERALS = 'Your collaterals:',
  // cancel orders
  ORDER_CANCELLED = 'Successfully cancelled:',
  // perp trade
  PERP_TRADE = 'Successfully placed',
}
