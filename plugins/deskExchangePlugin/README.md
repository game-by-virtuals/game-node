# Desk Plugin

A plugin for interacting with a trading desk/exchange, providing functionality for perpetual trading, account management, and order handling.

## Features

- Account summary retrieval
- Perpetual trading execution
- Order management (placing and canceling orders)

## Installation

```bash
pnpm install @virtuals-protocol/game-desk-exchange-plugin
```

## Configuration

The plugin requires the following environment variables:

- `DESK_EXCHANGE_PRIVATE_KEY`: Your private key for authentication
- `DESK_EXCHANGE_NETWORK`: Network to connect to (`mainnet` or `testnet`)

## Usage

### Initializing the Plugin

```typescript
import DeskExchangePlugin from '@virtuals-protocol/game-desk-exchange-plugin'

const deskExchangePlugin = new DeskExchangePlugin({
  credentials: {
    network: 'testnet', // or 'mainnet'
    privateKey: 'YOUR_PRIVATE_KEY'
  }
})
```

### Available Functions

#### Get Account Summary

Retrieves a comprehensive summary of your account, including positions, orders, and collaterals.

```typescript
const summary = await deskExchangePlugin.getAccountSummary.executable({}, logger)
```

#### Place Perpetual Trade

Execute a perpetual trade with specified parameters.

```typescript
const tradeRequest = {
  amount: '1',        // Desired amount
  price: '10000',     // Market price
  side: 'Long',       // 'Long' or 'Short'
  symbol: 'BTC'       // Trading pair symbol (without 'USD')
}

const trade = await deskExchangePlugin.perpTrade.executable(tradeRequest, logger)
```

#### Cancel Orders

Cancel all open orders for the account.

```typescript
const cancelResult = await deskExchangePlugin.cancelOrders.executable({}, logger)
```

## Response Format

All functions return an `ExecutableGameFunctionResponse` with the following structure:

```typescript
{
  status: ExecutableGameFunctionStatus;
  feedback: string;
}
```

## Testing

To run the tests:

```bash
pnpm test
```

Make sure to set up the required environment variables before running tests.

## License

[License Type] - See LICENSE file for details