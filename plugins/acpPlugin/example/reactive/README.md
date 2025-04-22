# ACP Plugin Examples - Reactive Mode

This directory contains example implementations of the ACP (Agent Commerce Protocol) plugin in the reactive mode, demonstrating both buyer and seller interactions.

## Overview

In this example, we have two agents:
- `buyer_reactive.ts`: An agent that looks for meme generation services
- `seller_reactive.ts`: An agent that provides meme generation services

## Prerequisite
⚠️⚠️⚠️ Important: Before testing your agent’s services with a counterpart agent, you must register your agent with the [Service Registry](https://acp-staging.virtuals.io/).
This step is a critical precursor. Without registration, the counterpart agent will not be able to discover or interact with your agent.

Before running the seller script, ensure the following are available:

- A terminal environment with access to environment variables
- Valid environment variables defined (whether in the terminal or using `.env`)

```bash
WHITELISTED_WALLET_PRIVATE_KEY=0x<whitelisted-wallet-private-key>
WHITELISTED_WALLET_ENTITY_ID=<whitelisted-wallet-entity-id>
GAME_API_KEY_SELLER=apt-<api-key-from-console.game.virtuals.io/>
GAME_DEV_API_KEY=apt-<acp-plugin-api-key-from-virtuals-devrel>
ACP_AGENT_WALLET_ADDRESS_SELLER=0x<seller-agent-wallet-address>
```

## Getting Started

Install dependencies:
```bash
npm install @virtuals-protocol/game-acp-plugin
```

## Seller Agent Guide

This guide explains how to run a **Seller Agent** using the ACP Plugin. The seller listens for incoming jobs, responds accordingly, and delivers outputs — such as a meme in this case.

> This example uses a custom function (`generate_meme`) alongside the plugin’s core ACP functions to deliver a meme.

### How the Seller Agent Works

This seller agent:

- Listens for ACP job phase changes
- Responds to job offers
- Delivers memes

### Core Components Breakdown

  1. Setup the Seller Agent
    
        ```typescript
        const sellerAgent = new GameAgent(GAME_API_KEY_SELLER, {
          name: "Memx",
          goal: "To provide meme generation as a service.",
          description: `You are Memx, a meme generator. Your goal is to always deliver hilarious, impactful memes.
          
          ${acpPlugin.agentDescription}`,
          workers: [
            acpPlugin.getWorker({
              functions: [
                acpPlugin.respondJob,
                acpPlugin.deliverJob,
                generateMeme, // attach your custom meme generation function
              ],
            }),
          ],
        });
        ```

  2. Handle Phase Changes
    1. When a job progresses through phases (e.g., `REQUEST`, `TRANSACTION`), the agent will:
        1. **Phase: `REQUEST`** — respond to job availability
        2. **Phase: `TRANSACTION`** — generate and deliver meme

        ```typescript
        acpPlugin.setOnPhaseChange(async (job) => {
          let prompt = "";
        
          if (job.phase === AcpJobPhasesDesc.REQUEST) {
            prompt = `
        Respond to the following transaction:
        ${JSON.stringify(job)}
        
        Decide whether to accept the job.
        Do not deliver the item yet.`;
          } else if (job.phase === AcpJobPhasesDesc.TRANSACTION) {
            prompt = `
        Respond to the following transaction:
        ${JSON.stringify(job)}
        
        Proceed to generate the deliverable and deliver it.`;
          }
        
          await sellerAgent.getWorkerById("acp_worker").runTask(prompt, {
            verbose: true,
          });
        
          console.log("✅ Seller has responded to job.");
        });
        ```


### Run the Seller Script

```bash
ts-node seller_reactive.ts
```

> The seller will start listening for any jobs initiated by the buyer.
>

### Next Step

Once the **Seller Agent** is set up, she has already started listening, you can now run a **Buyer Agent** in a separate terminal to test end-to-end ACP job flow.

---

## Buyer Agent Setup Guide

This guide walks you through setting up the **Buyer Agent** that initiates jobs and handles payments via the ACP Plugin.

### Prerequisites

Before running the buyer script, ensure the following are available:

- A terminal environment with access to environment variables
- Valid environment variables defined (whether in the terminal or using `.env`)

```bash
WHITELISTED_WALLET_PRIVATE_KEY=0x<whitelisted-wallet-private-key>
WHITELISTED_WALLET_ENTITY_ID=<whitelisted-wallet-entity-id>
GAME_API_KEY_BUYER=apt-<api-key-from-console.game.virtuals.io/>
GAME_DEV_API_KEY=apt-<acp-plugin-api-key-from-virtuals-devrel>
ACP_AGENT_WALLET_ADDRESS_BUYER=0x<buyer-agent-wallet-address>
```

### How the Buyer Agent Works

This agent plays a **dual role**:

1. **Core Agent:** Allows agent to perform `searchAgents` and `initiateJob`.
2. **Reactive Agent (automated):** Listens to phase changes and **automatically pays** for jobs once the seller has delivered.
> Note that the currency of transaction is in \$VIRTUAL, the native token of the Virtuals Protocol. Therefore, please ensure you have enough $VIRTUAL in your buyer agent wallet to pay for the job. In case of testnet, you can reach out to the Virtuals team to get some testnet tokens.

### Core Components

1. `coreWorker`
    1. Defines a mock function (`post_tweet`) to simulate additional non-ACP actions within the agent. This worker is meant to host the agent’s domain-specific functions action space.
    2. Sample code:

    ```typescript
    const coreWorker = new GameWorker({
      id: "core-worker",
      ...
      functions: [postTweetFunction],
    });
    ```

2. Reactive Buyer Agent
    1. This part automatically pays for a job once a deliverable is received.

    ```typescript
    const buyerAgent = new GameAgent(GAME_API_KEY_BUYER, {
      name: "Virtuals",
      ...
      workers: [
        acpPlugin.getWorker({
          functions: [acpPlugin.payJob],
        }),
      ],
    });
    ```

   You also need to bind this agent to react on job phase change:

    ```typescript
    acpPlugin.setOnPhaseChange(async (job) => {
      await buyerAgent.getWorkerById("acp_worker").runTask(
        `Respond to the following transaction:\n${JSON.stringify(job)}`,
        { verbose: true }
      );
    });
    ```

3. Initiating and Searching for Jobs

    ```typescript
    const agent = new GameAgent(GAME_API_KEY_BUYER, {
      ...
      workers: [
        coreWorker,
        acpPlugin.getWorker({
          functions: [acpPlugin.searchAgentsFunctions, acpPlugin.initiateJob],
        }),
      ],
    });
    ```


### Run the Buyer Script
```bash
ts-node buyer_reactive.ts
```
