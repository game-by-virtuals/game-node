import {
  CancelOrderRequest,
  Collateral,
  DeskExchange,
  OpenOrder,
  OrderApiResponse,
  OrderRequest,
  Position,
  SubaccountSummary,
} from '@desk-exchange/typescript-sdk'
import {
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
  GameFunction,
  GameWorker,
} from '@virtuals-protocol/game'

import { FMT_ERRORS, GAME_WORKER_FUNCTION_NAME, SUCCESS_MESSAGES } from './constants'
import { errorHandler, formatNumber } from './utils'

function getPositionSummary(positions: Array<Position>): string {
  if (positions.length === 0) {
    return '- No active positions'
  }
  return positions
    .map((p: Position) => {
      return `- ${p.side} ${formatNumber(p.quantity)} ${p.symbol}`
    })
    .join('\n')
}

function getOrderSummary(orders: Array<OpenOrder>): string {
  if (orders.length === 0) {
    return '- No orders'
  }
  return orders
    .map((o: OpenOrder) => {
      const side: string = o.side === 'Long' ? 'Buy' : 'Sell'
      const [remain, total]: [string, string] = [
        formatNumber(Number(o.original_quantity) - Number(o.remaining_quantity)),
        formatNumber(Number(o.original_quantity)),
      ]
      const price: string = Number(o.price) > 0 ? formatNumber(o.price) : formatNumber(o.trigger_price || 0)
      return `- ${side} ${remain}/${total} ${o.symbol} @${price}`
    })
    .join('\n')
}

function getCollateralSummary(collaterals: Array<Collateral>): string {
  if (collaterals.length === 0) {
    return '- No collaterals'
  }
  return collaterals
    .map((c: Collateral) => {
      return `- ${formatNumber(c.amount, 4)} ${c.asset}`
    })
    .join('\n')
}

function generateGetAccountSummaryMessageResponse(
  subAccount: string,
  positionSummary: string,
  orderSummary: string,
  colleteralSummary: string,
): string {
  return `${SUCCESS_MESSAGES.ACCOUNT_SUMMARY} ${subAccount}\n${SUCCESS_MESSAGES.YOUR_POSITIONS}\n${positionSummary}\n${SUCCESS_MESSAGES.YOUR_ORDERS}\n${orderSummary}\n${SUCCESS_MESSAGES.YOUR_COLLATERALS}\n${colleteralSummary}`
}

function generatePerpTradeMessageResponse(
  type: string,
  quantity: string,
  price: string,
  side: string,
  symbol: string,
): string {
  const at: string = type === 'Market' ? 'Market Price' : `${formatNumber(price)} USD`
  return `${SUCCESS_MESSAGES.PERP_TRADE} a ${side} ${type} order of size ${formatNumber(quantity)} on ${symbol} at ${at} on DESK Exchange.`
}

interface IDeskExchangePluginOptions {
  id?: string
  name?: string
  description?: string
  credentials: {
    network: 'testnet' | 'mainnet'
    privateKey: string
  }
}

class DeskExchangePlugin {
  private id: string
  private name: string
  private description: string
  private sdk: DeskExchange

  constructor(options: IDeskExchangePluginOptions) {
    this.id = options.id || 'desk_plugin'
    this.name = options.name || 'DESK Plugin'
    this.description = options.description || 'DESK Plugin for managing perpetual trades and positions on exchange.'

    this.sdk = new DeskExchange({
      network: options.credentials.network,
      privateKey: options.credentials.privateKey,
      subAccountId: 0,
      enableWs: false,
    })
  }

  public getWorker(data?: {
    functions?: Array<GameFunction<Array<any>>>
    getEnvironment?: () => Promise<Record<string, any>>
  }): GameWorker {
    return new GameWorker({
      id: this.id,
      name: this.name,
      description: this.description,
      functions: data?.functions || [this.getAccountSummary, this.cancelOrders, this.perpTrade],
      getEnvironment: data?.getEnvironment,
    })
  }

  get getAccountSummary(): GameFunction<Array<any>> {
    return new GameFunction({
      name: GAME_WORKER_FUNCTION_NAME.GET_ACCOUNT_SUMMARY,
      description: 'Get the account summary.',
      args: [] as const,
      executable: async (_: unknown, logger: (msg: string) => void) => {
        try {
          logger('Executing get account summary...')
          const subAccountSummaryResponse: SubaccountSummary = await this.sdk.exchange.getSubAccountSummary()
          const positionSummary: string = getPositionSummary(subAccountSummaryResponse.positions)
          const orderSummary: string = getOrderSummary(subAccountSummaryResponse.open_orders)
          const collateralSummary: string = getCollateralSummary(subAccountSummaryResponse.collaterals)
          const walletAddress: string = this.sdk.auth.wallet?.address || 'unknown'
          const msg: string = generateGetAccountSummaryMessageResponse(
            walletAddress,
            positionSummary,
            orderSummary,
            collateralSummary,
          )
          logger('Done get account summary.')
          return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, msg)
        } catch (e: unknown) {
          return errorHandler(FMT_ERRORS.FAILED_TO_GET_ACCOUNT_SUMMARY, e, logger)
        }
      },
    })
  }

  get perpTrade(): GameFunction<Array<any>> {
    return new GameFunction({
      name: GAME_WORKER_FUNCTION_NAME.PERP_TRADE,
      description: 'Place a perpetual contract trade order on DESK Exchange.',
      args: [
        {
          name: 'amount',
          description: 'The amount of the trade.',
          type: 'string',
        },
        {
          name: 'price',
          description: 'The price of the trade. (0 for market orders, or specify a limit price.)',
          type: 'string',
        },
        {
          name: 'side',
          description: "The side of the trade. ('Long', 'Short')",
          type: 'string',
        },
        {
          name: 'symbol',
          description: 'The symbol of the perpetual contract to trade.',
          type: 'string',
        },
      ] as const,
      executable: async (
        { amount, price, side, symbol }: Partial<{ amount: string; price: string; side: string; symbol: string }>,
        logger: (msg: string) => void,
      ) => {
        try {
          logger('Executing place perpetual contract trade order...')
          if (!amount) {
            throw new Error('amount is required')
          }
          if (!price) {
            throw new Error('price is required')
          }
          if (!side) {
            throw new Error('side is required')
          }
          if (!symbol) {
            throw new Error('symbol is required')
          }
          const convertedPrice: number = Number(price)
          if (isNaN(convertedPrice)) {
            throw new Error('price is NaN')
          }
          const orderType: 'Market' | 'Limit' = convertedPrice === 0 ? 'Market' : 'Limit'
          const request: OrderRequest = {
            symbol: `${symbol}USD`,
            side: side as OrderRequest['side'],
            amount: amount,
            price: price,
            orderType: orderType,
            reduceOnly: false,
          }

          const response: OrderApiResponse = await this.sdk.exchange.placeOrder(request)
          const msg: string = generatePerpTradeMessageResponse(
            response.order_type,
            response.quantity,
            response.price,
            response.side,
            response.symbol,
          )
          logger('Done place perpetual contract trade order.')
          return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, msg)
        } catch (e: unknown) {
          return errorHandler(FMT_ERRORS.FAILED_TO_PERP_TRADE, e, logger)
        }
      },
    })
  }

  get cancelOrders(): GameFunction<Array<any>> {
    return new GameFunction({
      name: GAME_WORKER_FUNCTION_NAME.CANCEL_ORDERS,
      description: 'Cancel open orders in your account.',
      args: [] as const,
      executable: async (_: unknown, logger: (msg: string) => void) => {
        try {
          logger('Executing cancelling orders...')
          const subAccountSummaryResponse: SubaccountSummary = await this.sdk.exchange.getSubAccountSummary()
          const openOrders: Array<OpenOrder> = subAccountSummaryResponse.open_orders
          const size: number = openOrders.length
          if (size === 0) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Done,
              `${SUCCESS_MESSAGES.ORDER_CANCELLED} no any current open orders.`,
            )
          }
          const requests: Array<CancelOrderRequest> = Array(size)
          for (let i: number = 0; i < size; i++) {
            requests[i] = {
              symbol: openOrders[i].symbol,
              orderDigest: openOrders[i].order_digest,
              waitForReply: false,
            }
          }
          await this.sdk.exchange.batchCancelOrder(requests)
          const response: string = `${SUCCESS_MESSAGES.ORDER_CANCELLED} ${openOrders.length} order${openOrders.length > 1 ? 's' : ''}.`
          logger('Done cancelling orders.')
          return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, response)
        } catch (e: unknown) {
          return errorHandler(FMT_ERRORS.FAILED_TO_CANCEL_ORDERS, e, logger)
        }
      },
    })
  }
}

export default DeskExchangePlugin
