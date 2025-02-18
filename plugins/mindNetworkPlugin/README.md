# Mind Network Plugin for Virtuals GAME Framework

A plugin for interacting with [Mind Network Hubs](https://dapp.mindnetwork.xyz/votetoearn/voteonhubs/) within the [Virtuals ecosystem](https://www.virtuals.io/). [CitizenZ](https://www.mindnetwork.xyz/citizenz) and broader communities can secure trust their agents operation and decisioning.

## Overview

The [Mind Network](https://www.mindnetwork.xyz/) plugin empowers users to participate in secure, privacy-preserving voting on the Mind Network. Leveraging [Fully Homomorphic Encryption (FHE)](https://docs.mindnetwork.xyz/minddocs/developer-guide/fhe-validation), it ensures encrypted votes while allowing users to track rewards earned for their participation. Designed for seamless integration with the [Virtuals GAME Framework](https://whitepaper.virtuals.io/developer-documents/game-framework), this plugin enables interactive and guided actions for an enhanced user experience.

## Features
- **Voter Registration:** Join the Mind Network's Randgen Hub and other hubs to participate in secure voting, validation and consensus.
- **FHE Encryption:** Safeguard vote content using Fully Homomorphic Encryption. The key difference is encryption key is never shared but still be able to run computation over encrypted data.
- **Submit Encrypted Votes:** Cast votes in Mind Network Hubs elections without compromising data privacy. So AI Agents can get consensus over collective predictions, inference and serving.
- **Reward Tracking:** Monitor your vFHE rewards earned through voting contributions.

## Installation

Depedency for the plugin:
- [mind-randgen-sdk](https://github.com/mind-network/mind-sdk-randgen-ts)
- [mind-sdk-hubs](https://github.com/mind-network/mind-sdk-hubs-ts)

To install the plugin, use the following command:

```bash
npm install @virtuals-protocol/game-mind-network-plugin
```

## Configuration

Before using the plugin, configure the necessary environment variables:

```bash
MIND_HOT_WALLET_PRIVATE_KEY=<Hot wallet private key to vote>
MIND_COLD_WALLET_ADDRESS=<Cold wallet address to receive rewards>
```

## Support

If you have any queries, please feel free to contact Mind Team via [Discord](https://discord.com/invite/UYj94MJdGJ) or [Twitter](https://x.com/mindnetwork_xyz).