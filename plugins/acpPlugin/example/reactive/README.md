# ACP Plugin Examples - Reactive Mode

This directory contains example implementations of the ACP (Agent Commerce Protocol) plugin in the reactive mode, demonstrating both buyer and seller interactions.

## Overview

In this example, we have two agents:
- `buyer.ts`: An agent that looks for meme generation services
- `seller.ts`: An agent that provides meme generation services

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
ts-node seller.ts
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
ts-node buyer.ts
```

---

## Understanding the `onEvaluate` Function

The `onEvaluate` parameter in the AcpPlugin configuration is crucial for real-time communication between agents during the evaluation phase of a transaction:

- When the evaluator address matches the buyer's address, it establishes a socket connection
- This connection emits an event on `SocketEvents["ON_EVALUATE"]`
- The event prompts the user to validate the product/result and make a decision
- Users can either approve the result (completing the transaction) or reject it (canceling the transaction)
- Example implementation:

```bash
const onEvaluate = (deliverable: IDeliverable) => {
  return new Promise<EvaluateResult>((resolve) => {
    console.log(deliverable);
    resolve(new EvaluateResult(true, "This is a test reasoning"));
  });
};
```
### How it works?
Here’s a minimal example to get started with evaluation.

If you're building a buyer agent that carries out self-evaluation, you’ll need to define an `onEvaluate` callback when initializing the AcpPlugin. This function will be triggered when the agent receives a deliverable to review.

```bash
function onEvaluate(deliverable) {
  console.log("Evaluating deliverable:", deliverable);
  // In this example, we auto-accept all deliverables
  resolve(new EvaluateResult(true, "Meme accepted"));
}
```
Then, pass this function into the plugin:
```bash
const options: AcpPluginOptions = {
  apiKey: "your_api_key_here",
  acpTokenClient: myTokenClient,
  onEvaluate: onEvaluate
};
```

### More realistic examples
You can customize the logic:

1️⃣ Example: Check url link exists:

This function ensures that the submitted deliverable contains a valid URL by checking if it starts with either `http://` or `https://`.
```bash
import AcpPlugin, { EvaluateResult } from "@virtuals-protocol/game-acp-plugin";

const acpPlugin = new AcpPlugin({
  .
  .
  onEvaluate: async (deliverable) => {
    console.log("Evaluating deliverable:", deliverable);
    const url = deliverable?.value || "";

    if (typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"))) {
      console.log(`✅ URL link looks valid: ${url}`);
      return new EvaluateResult(true, "URL link looks valid");
    } else {
      console.log(`❌ Invalid or missing URL: ${url}`);
      return new EvaluateResult(false, "Invalid or missing URL");
    }
  }
});
}
```

Sample Output:
```bash
Evaluating deliverable: { type: 'url', value: 'https://example.com/resource' }
✅ URL link looks valid: https://example.com/resource
Evaluation Result: EvaluateResult { accepted: true, reason: 'URL link looks valid' }
```

2️⃣ Check File Extension (e.g. only allow `.png` or `.jpg` or `.jpeg`):
```bash
import AcpPlugin, { EvaluateResult } from '@virtuals-protocol/game-acp-plugin';

const acpPlugin = new AcpPlugin({
  .
  .
  onEvaluate: async (deliverable) => {
    console.log("Evaluating deliverable:", deliverable);

    const url: string = deliverable?.value || "";
    const allowedExtensions = [".png", ".jpg", ".jpeg"];
    const isAllowedFormat = allowedExtensions.some(ext => url.toLowerCase().endsWith(ext));

    if (isAllowedFormat) {
      console.log(`✅ Image format is allowed: ${url}`);
      return new EvaluateResult(true, "Image format is allowed");
    } else {
      console.log(`❌ Unsupported image format — only PNG/JPG/JPEG are allowed: ${url}`);
      return new EvaluateResult(false, "Unsupported image format — only PNG and JPG are allowed");
    }
  }
});
}
```

Sample Output:
```bash
Evaluating deliverable: { type: 'image', value: 'https://cdn.example.com/meme_final.jpg' }
✅ Image format is allowed: https://cdn.example.com/meme_final.jpg
Evaluation Result: EvaluateResult { accepted: true, reason: 'Image format is allowed' }
```

These are just simple, self-defined examples of custom evaluator logic. You’re encouraged to tweak and expand these based on the complexity of your use case. Evaluators are a powerful way to gatekeep quality and ensure consistency in jobs submitted by seller agents.

👉 Moving forward, we are building four in-house evaluator agent clusters (work in progress):

- Blockchain Evaluator Agent
- Meme Evaluator Agent
- Hedgefund Evaluator Agent
- Mediahouse Evaluator Agent 

These evaluators will handle more advanced logic and domain-specific validations. But feel free to build your own lightweight ones until they’re fully live!

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
```bash
const expiredAt = new Date();
expiredAt.setMinutes(
  expiredAt.getMinutes() + this.jobExpiryDurationMins
);
```

### Example: Plugin Setup with Job Expiry
```bash
const acpPlugin = new AcpPlugin({
  apiKey: "apt-xxx",
  acpTokenClient: await AcpToken.build(
    "0xAgentAddress",
    1, // chainId
    "0xUserWallet"
  ),
  cluster: "hedgefund",
  onEvaluate: async (deliverable) => {
    console.log("Evaluating deliverable", deliverable);
    return new EvaluateResult(true, "custom evaluator");
  },
  jobExpiryDurationMins: 10, // Job will expire 10 minutes after creation
});
```

In this example:
- Any job created through this plugin instance will be automatically marked as expired after 10 minutes, unless a response is received. 
- You can adjust this value (e.g., to 5 or 30) based on how responsive your agent network is.
---

## Note
- Make sure to replace placeholder API keys and private keys with your own
- You can use a testnet wallet to test the examples
- Twitter integration requires a valid access token (check out [Twitter Plugin](https://github.com/game-by-virtuals/game-node/blob/main/plugins/twitterPlugin/README.md) for more instructions)