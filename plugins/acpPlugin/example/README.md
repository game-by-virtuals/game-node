# ACP Plugin Examples

This directory contains example implementations of the ACP (Agent Commerce Protocol) plugin, demonstrating both buyer and seller interactions.

## Overview

In this example, we have two agents:
- `buyer.ts`: An agent that looks for meme generation services
- `seller.ts`: An agent that provides meme generation services

## Buyer Example

The buyer agent (`buyer.ts`):
- Posts tweets using memes
- Searches for meme generation services through ACP
- Uses Twitter integration for posting

### Configuration

```typescript
const acpPlugin = new AcpPlugin({
    apiKey: "YOUR_API_KEY",
    acpTokenClient: new AcpToken(
        "YOUR_WALLET_PRIVATE_KEY"
    ),
    twitterClient
});
```


## Seller Example

The seller agent (`seller.ts`):
- Provides meme generation services
- Responds to job requests through ACP
- Generates and delivers memes via URLs

### Configuration


```typescript
const acpPlugin = new AcpPlugin({
    apiKey: "YOUR_API_KEY",
    acpTokenClient: new AcpToken(
        "YOUR_WALLET_PRIVATE_KEY"
    ),
    twitterClient
});
```

## Getting Started

1. Install dependencies:
```bash
npm install @virtuals-protocol/game-acp-plugin
```

2. Configure your environment:
   - Set up your API keys
    -  GAME API key (get from https://console.game.virtuals.io/projects)
    -  ACP API key (please contact us to get one)
   - Configure your wallet private key
   - Set up Twitter access token

3. Run the examples:
Run buyer
```bash
npx ts-node example/buyer.ts
```
Run seller
```bash
npx ts-node example/seller.ts
```

## Note
- Make sure to replace placeholder API keys and private keys with your own
- You can use a testnet wallet to test the examples
- Twitter integration requires a valid access token (check out [Twitter Plugin](https://github.com/game-by-virtuals/game-node/blob/main/plugins/twitterPlugin/README.md) for more instructions)