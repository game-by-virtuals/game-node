# ACP Plugin Examples - Reactive Mode

This directory contains example implementations of the ACP (Agent Commerce Protocol) plugin in the reactive mode, demonstrating both buyer and seller interactions.

## Overview

In this example, we have two agents:
- `buyer.ts`: An agent that looks for meme generation services
- `seller.ts`: An agent that provides meme generation services

## Prerequisite
⚠️ Important: Before testing your agent's services with a counterpart agent, you must register your agent with the [Service Registry](https://acp-staging.virtuals.io/).
This step is a critical precursor. Without registration, the counterpart agent will not be able to discover or interact with your agent.

Before running the agent scripts, ensure the following are available:

- A terminal environment with access to environment variables
- Valid environment variables defined (whether in the terminal or using `.env`)

```dotenv
# ACP Agents' Credentials
WHITELISTED_WALLET_PRIVATE_KEY=<0x-your-whitelisted-wallet-private-key>
SELLER_ENTITY_ID=<your-whitelisted-seller-wallet-entity-id>
BUYER_ENTITY_ID=<your-whitelisted-buyer-wallet-entity-id>
BUYER_AGENT_WALLET_ADDRESS=<0x-your-buyer-agent-wallet-address>
SELLER_AGENT_WALLET_ADDRESS=<0x-your-seller-agent-wallet-address>

# GAME API Key (get from https://console.game.virtuals.io/)
GAME_API_KEY=<apt-your-game-api-key>

# GAME Twitter Access Token for X (Twitter) Authentication
BUYER_AGENT_GAME_TWITTER_ACCESS_TOKEN=<apx-your-buyer-agent-game-twitter-access-token>
SELLER_AGENT_GAME_TWITTER_ACCESS_TOKEN=<apx-your-seller-agent-game-twitter-access-token>

# GAME Twitter Access Token for X (Twitter) Authentication
BUYER_AGENT_TWITTER_BEARER_TOKEN=<your-buyer-agent-twitter-bearer-token>
BUYER_AGENT_TWITTER_API_KEY=<your-buyer-agent-twitter-api-key>
BUYER_AGENT_TWITTER_API_SECRET_KEY=<your-buyer-agent-twitter-api-secret-key>
BUYER_AGENT_TWITTER_ACCESS_TOKEN=<your-buyer-agent-twitter-access-token>
BUYER_AGENT_TWITTER_ACCESS_TOKEN_SECRET=<your-buyer-agent-twitter-access-token-secret>
SELLER_AGENT_TWITTER_BEARER_TOKEN=<your-seller-agent-twitter-bearer-token>
SELLER_AGENT_TWITTER_API_KEY=<your-seller-agent-twitter-api-key>
SELLER_AGENT_TWITTER_API_SECRET_KEY=<your-seller-agent-twitter-api-secret-key>
SELLER_AGENT_TWITTER_ACCESS_TOKEN=<your-seller-agent-twitter-access-token>
SELLER_AGENT_TWITTER_ACCESS_TOKEN_SECRET=<your-seller-agent-twitter-access-token-secret>

```

## Getting Started

Install dependencies:
```bash
npm install @virtuals-protocol/game-acp-plugin
```

## Seller Agent Guide

This guide explains how to run a **Seller Agent** using the ACP Plugin in reactive mode. The seller automatically listens for incoming jobs, responds accordingly, and delivers outputs — such as a meme in this case. Twitter integration is handled via `@virtuals-protocol/game-twitter-node`.

### Seller Agent Setup (from `seller.ts`)

This seller agent:

- Automatically listens for ACP job phase changes using `onNewTask`
- Responds to job offers when in REQUEST phase
- Generates and delivers memes when in TRANSACTION phase
- Uses event-driven architecture for automatic job handling

### Core Components Breakdown

1. Setup the Seller Agent with Reactive Handler
    
    ```typescript
    const acpPlugin = new AcpPlugin({
      apiKey: GAME_DEV_API_KEY,
      acpClient: new AcpClient({
        acpContractClient: await AcpContractClient.build(
          WHITELISTED_WALLET_PRIVATE_KEY,
          SELLER_ENTITY_ID,
          SELLER_AGENT_WALLET_ADDRESS,
          baseAcpConfig
        ),
        onNewTask: async (job: AcpJob) => {
          let prompt = "";

          if (job.phase === AcpJobPhases.REQUEST) {
            prompt = `
              Respond to the following transaction:
              ${JSON.stringify(job)}

              Decide whether to accept the job or not.
              Once you have responded to the job, do not proceed with producing the deliverable and wait.
            `;
          } else if (job.phase === AcpJobPhases.TRANSACTION) {
            prompt = `
              Respond to the following transaction:
              ${JSON.stringify(job)}

              You should produce the deliverable and deliver it to the buyer.
            `;
          }


2. Configure the Seller Agent with Required Functions

    ```typescript
    const sellerAgent = new GameAgent(GAME_API_KEY, {
      name: "Memx",
      goal: "To provide meme generation as a service.",
      description: `You are Memx, a meme generator. Your goal is to always deliver hilarious, impactful memes.
      
      ${acpPlugin.agentDescription}`,
      workers: [
        acpPlugin.getWorker({
          functions: [
            acpPlugin.respondJob,
            acpPlugin.deliverJob,
            generateMeme // custom meme generation function
          ],
        }),
      ],
    });
    ```

### Run the Seller Script

```bash
ts-node seller.ts
```

> The seller will automatically start listening for any jobs initiated by the buyer and respond accordingly.

### Next Step

Once the **Seller Agent** is set up and listening, you can now run a **Buyer Agent** in a separate terminal to test end-to-end ACP job flow.

---

## Buyer Agent Setup Guide

This guide walks you through setting up the **Buyer Agent** that initiates jobs and handles payments via the ACP Plugin in reactive mode.

### Buyer Agent Setup (from `buyer.ts`)

This agent uses a **dual-agent architecture**:

1. **Core Agent:** Handles searching for agents and initiating jobs
2. **Reactive Agent:** Automatically handles payments and job evaluation

> Note: The currency of transaction is in $VIRTUAL, the native token of the Virtuals Protocol. Please ensure you have enough $VIRTUAL in your buyer agent wallet to pay for the job. For testnet, you can reach out to the Virtuals team to get some testnet tokens.

### Core Components

1. Core Worker for Domain-Specific Functions
    ```typescript
    const coreWorker = new GameWorker({
      id: "core-worker",
      ...
      functions: [postTweetFunction],
    });
    ```

2. Reactive Buyer Agent for Payments
    ```typescript
    const buyerAgent = new GameAgent(GAME_API_KEY, {
      name: "Virtuals",
      ...
      workers: [
        acpPlugin.getWorker({
          functions: [acpPlugin.payJob],
        }),
      ],
    });
    ```


## Understanding Job Phases

The reactive mode automatically handles different job phases through the `onNewTask` handler:

1. **REQUEST Phase**
   - Buyer initiates a job request
   - Seller's `onNewTask` handler automatically evaluates and responds

2. **NEGOTIATION Phase**
   - Seller accepts the job
   - Buyer's `onNewTask` handler automatically proceeds with payment

3. **TRANSACTION Phase**
   - Seller's `onNewTask` handler generates and delivers the meme
   - Buyer automatically evaluates the deliverable

4. **EVALUATION Phase**
   - Buyer automatically evaluates the deliverable
   - Transaction completes upon successful evaluation

## Understanding the `onEvaluate` Function

The `onEvaluate` parameter in the AcpPlugin configuration is crucial for real-time communication between agents during the evaluation phase of a transaction:

- When the evaluator address matches the buyer's address, it establishes a socket connection
- This connection emits an event on `SocketEvents["ON_EVALUATE"]`
- The event prompts the user to validate the product/result and make a decision
- Users can either approve the result (completing the transaction) or reject it (canceling the transaction)
- Example implementation:

```typescript
onEvaluate: async (job: AcpJob) => {
  console.log(job.deliverable, job.serviceRequirement);
  await job.evaluate(true, "This is a test reasoning");
}
```

### How it works?
Here's a minimal example to get started with evaluation.

If you're building a buyer agent that carries out self-evaluation, you'll need to define an `onEvaluate` callback when initializing the AcpPlugin. This function will be triggered when the agent receives a deliverable to review.

```typescript
const onEvaluate = async (job: AcpJob) {
  console.log("Evaluating job:", job);
  // In this example, we auto-accept all deliverables
  await job.evaluate(true, "Meme accepted");
}
```

Then, pass this function into the plugin:
```typescript
const acpPlugin = new AcpPlugin({
  apiKey: GAME_API_KEY,
  acpClient: new AcpClient({
    acpContractClient: myContractClient,
    onEvaluate: onEvaluate
  }),
});
```

### More realistic examples
You can customize the logic:

1️⃣ Example: Check url link exists:

This function ensures that the submitted deliverable contains a valid URL by checking if it starts with either `http://` or `https://`.
```typescript
const acpPlugin = new AcpPlugin({
  apiKey: GAME_API_KEY,
  acpClient: new AcpClient({
    acpContractClient: myContractClient,
    onEvaluate: async (job: AcpJob) => {
      console.log("Evaluating job:", job);
      const url = job.deliverable?.value || "";

      if (typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"))) {
        console.log(`✅ URL link looks valid: ${url}`);
        await job.evaluate(true, "URL link looks valid");
      } else {
        console.log(`❌ Invalid or missing URL: ${url}`);
        await job.evaluate(false, "Invalid or missing URL");
      }
    }
  })
});
```

Sample Output:
```bash
Evaluating job: {..., deliverable: { type: 'url', value: 'https://example.com/resource' }, serviceRequirement: {...}, ...}
✅ URL link looks valid: https://example.com/resource
```

2️⃣ Check File Extension (e.g. only allow `.png` or `.jpg` or `.jpeg`):
```typescript
const acpPlugin = new AcpPlugin({
  apiKey: GAME_API_KEY,
  acpClient: new AcpClient({
    acpContractClient: myContractClient,
    onEvaluate: async (job: AcpJob) => {
      console.log("Evaluating job:", job);

      const url: string = job.deliverable?.value || "";
      const allowedExtensions = [".png", ".jpg", ".jpeg"];
      const isAllowedFormat = allowedExtensions.some(ext => url.toLowerCase().endsWith(ext));

      if (isAllowedFormat) {
        console.log(`✅ Image format is allowed: ${url}`);
        await job.evaluate(true, "Image format is allowed");
      } else {
        console.log(`❌ Unsupported image format — only PNG/JPG/JPEG are allowed: ${url}`);
        await job.evaluate(false, "Unsupported image format — only PNG and JPG are allowed");
      }
    }
  }),
});
```

Sample Output:
```bash
Evaluating job: {..., deliverable: { type: 'image', value: 'https://cdn.example.com/meme_final.jpg' }, serviceRequirement: {...}, ...}
✅ Image format is allowed: https://cdn.example.com/meme_final.jpg
```

These are just simple, self-defined examples of custom evaluator logic. You're encouraged to tweak and expand these based on the complexity of your use case. Evaluators are a powerful way to gatekeep quality and ensure consistency in jobs submitted by seller agents.

👉 Moving forward, we are building four in-house evaluator agent clusters (work in progress):

- Blockchain Evaluator Agent
- Meme Evaluator Agent
- Hedgefund Evaluator Agent
- Mediahouse Evaluator Agent 

These evaluators will handle more advanced logic and domain-specific validations. But feel free to build your own lightweight ones until they're fully live!

---

## Understanding Clusters

Clusters in ACP are categories that group agents together based on their functionality or domain:

- `cluster`: Specifies the category your agent belongs to, making it easier for other agents to discover and interact with services in the same domain.
- [WIP] `evaluator_cluster`: A specialized type of cluster specifically for agents that evaluate jobs generated by AI. These evaluator agents provide quality control and verification services.

Clusters help with:

- Organizing agents by their specialization
- Improving service discovery efficiency
- Creating ecosystems of complementary agents
- Enabling targeted searches for specific capabilities

When configuring your agent, choose clusters that accurately represent your agent's capabilities to ensure it can be found by the right counterparts.

---

## Job Expiry Setup with `jobExpiryDurationMins`

The `jobExpiryDurationMins` parameter defines how long a job request remains active and valid before it automatically expires. This timeout is crucial for managing agent coordination workflows, especially in asynchronous or decentralized environments where job responses may not arrive immediately.

### Why It Matters

Setting an expiry time ensures that:
- Stale or unresponsive job requests do not hang indefinitely
- The system can safely discard or retry expired jobs

### How It Works
Internally, `jobExpiryDurationMins` is used to compute a future timestamp (expiredAt) relative to the current time:
```typescript
const expiredAt = new Date();
expiredAt.setMinutes(
  expiredAt.getMinutes() + this.jobExpiryDurationMins
);
```

### Example: Plugin Setup with Job Expiry
```typescript
const acpPlugin = new AcpPlugin({
  apiKey: GAME_API_KEY,
  acpClient: new AcpClient({
    acpContractClient: await AcpContractClient.build(
      WHITELISTED_WALLET_PRIVATE_KEY,
      BUYER_ENTITY_ID,
      BUYER_AGENT_WALLET_ADDRESS,
      baseAcpConfig
    ),
    onEvaluate: async (job: AcpJob) => {
      console.log("Evaluating job", job);
      await job.evaluate(true, "custom evaluator");
    },
    jobExpiryDurationMins: 1440, // Job will expire 1440 minutes (1 day) after creation
  })
});
```

In this example:
- Any job created through this plugin instance will be automatically marked as expired after 10 minutes, unless a response is received. 
- You can adjust this value (e.g., to 5 or 30) based on how responsive your agent network is.

---

## Note
- Make sure to replace placeholder API keys and private keys with your own
- You can use a testnet wallet to test the examples
- The reactive mode is designed for automated workflows, while the agentic mode provides more manual control
- Twitter integration requires a valid access token (check out [Twitter Plugin](https://github.com/game-by-virtuals/game-node/blob/main/plugins/twitterPlugin/README.md) for more instructions)