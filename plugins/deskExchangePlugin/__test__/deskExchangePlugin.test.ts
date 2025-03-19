import { beforeAll, describe, expect, it, jest } from '@jest/globals'
import { ExecutableGameFunctionResponse, ExecutableGameFunctionStatus, GameWorker } from '@virtuals-protocol/game'

import { GAME_WORKER_FUNCTIONS, SUCCESS_MESSAGES } from '../src/constants'
import DeskExchangePlugin from '../src/deskExchangePlugin'
import { logger } from './log'

describe('DeskExchangePlugin', () => {
  const DESK_EXCHANGE_PRIVATE_KEY: string = process.env.DESK_EXCHANGE_PRIVATE_KEY || ''
  const DESK_EXCHANGE_NETWORK: 'mainnet' | 'testnet' = process.env.DESK_EXCHANGE_NETWORK as 'mainnet' | 'testnet'
  let deskExchangePlugin: DeskExchangePlugin
  let _logger: (msg: string) => void

  // setup
  beforeAll(async () => {
    // clear caches
    jest.resetModules()
    // init desk plugin
    deskExchangePlugin = new DeskExchangePlugin({
      credentials: {
        network: DESK_EXCHANGE_NETWORK,
        privateKey: DESK_EXCHANGE_PRIVATE_KEY,
      },
    })
    // apply logger
    _logger = logger
  })

  // get worker
  describe('getWorker', () => {
    it('should return a GameWorker with default functions', () => {
      const worker: GameWorker = deskExchangePlugin.getWorker()
      expect(worker).toBeDefined()
      expect(worker.functions).toHaveLength(GAME_WORKER_FUNCTIONS.length)
      expect(worker.functions.map((f: GameWorker['functions'][0]) => f.name)).toEqual(GAME_WORKER_FUNCTIONS)
    })
  })

  // get account summary
  describe('getAccountSummary', () => {
    // success case
    it('should return account summary', async () => {
      const result: ExecutableGameFunctionResponse = await deskExchangePlugin.getAccountSummary.executable({}, _logger)
      expect(result).toBeDefined()
      expect(result.status).toBe(ExecutableGameFunctionStatus.Done)
      expect(result.feedback).toContain(SUCCESS_MESSAGES.ACCOUNT_SUMMARY)
      expect(result.feedback).toContain(SUCCESS_MESSAGES.YOUR_POSITIONS)
      expect(result.feedback).toContain(SUCCESS_MESSAGES.YOUR_ORDERS)
      expect(result.feedback).toContain(SUCCESS_MESSAGES.YOUR_COLLATERALS)
    })
  })

  // perp trade
  describe('perpTrade', () => {
    // success case (either found or not found)
    it('should successfully place order', async () => {
      const request: Partial<{ amount: string; price: string; side: string; symbol: string }> = {
        // NOTE: desire amount
        amount: 'YOUR_DESIRE_AMOUNT',
        // NOTE: check up price on market info
        price: 'YOUR_DESIRE_PRICE',
        // NOTE: side, ex:`Long` or `Short`
        side: 'YOUR_DESIRE_SIDE',
        // NOTE: symbol without `USD`, ex: `BTC`
        symbol: 'YOUR_DESIRE_SYMBOL',
      }
      const result: ExecutableGameFunctionResponse = await deskExchangePlugin.perpTrade.executable(request, _logger)
      expect(result).toBeDefined()
      expect(result.status).toBe(ExecutableGameFunctionStatus.Done)
      expect(result.feedback).toContain(SUCCESS_MESSAGES.PERP_TRADE)
    })
  })

  // cancel orders
  describe('cancelOrders', () => {
    // success case (either found or not found any open orders)
    it('should successfully cancel open orders', async () => {
      const result: ExecutableGameFunctionResponse = await deskExchangePlugin.cancelOrders.executable({}, _logger)
      expect(result).toBeDefined()
      expect(result.status).toBe(ExecutableGameFunctionStatus.Done)
      expect(result.feedback).toContain(SUCCESS_MESSAGES.ORDER_CANCELLED)
    })
  })
})
