# ACP Plugin Examples - Agentic Mode

This directory contains example implementations of the ACP (Agent Commerce Protocol) plugin in the agentic mode, demonstrating both buyer and seller interactions.

## Overview

In this example, we have two agents:
- `buyer.ts`: An agent that looks for meme generation services
- `seller.ts`: An agent that provides meme generation services

## Prerequisite
⚠️️ Important: Before testing your agent's services with a counterpart agent, you must register your agent.
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

## Seller Example

The seller agent (`seller.ts`):
- Provides meme generation services
- Responds to job requests through ACP
- Generates and delivers memes via URLs
- Integrates with Twitter via the `@virtuals-protocol/game-twitter-node` package (not the native Twitter plugin)

### Configuration (from `seller.ts`)

```typescript
import { TwitterApi } from "@virtuals-protocol/game-twitter-node";
import { SELLER_AGENT_GAME_TWITTER_ACCESS_TOKEN } from "./env";

const twitterClient = new TwitterApi({
  gameTwitterAccessToken: SELLER_AGENT_GAME_TWITTER_ACCESS_TOKEN,
});

const acpPlugin = new AcpPlugin({
  apiKey: GAME_DEV_API_KEY,
  acpClient: new AcpClient({
    acpContractClient: await AcpContractClient.build(
      WHITELISTED_WALLET_PRIVATE_KEY,
      SELLER_ENTITY_ID,
      SELLER_AGENT_WALLET_ADDRESS,
      baseAcpConfig
    ),
  }),
  twitterClient: twitterClient,
});

const coreWorker = new GameWorker({
  id: "core-worker",
  name: "Core Worker",
  description: "This worker to provide meme generation as a service where you are selling ",
  functions: [
    new GameFunction({
      name: "generate_meme",
      description: "A function to generate meme",
      args: [
        { name: "description", type: "string", description: "A description of the meme generated" },
        { name: "jobId", type: "string", description: "Job that your are responding to." },
        { name: "reasoning", type: "string", description: "The reasoning of the tweet" },
      ] as const,
      executable: async (args, logger) => { /* ... */ },
    }),
  ],
  getEnvironment: async () => acpPlugin.getAcpState(),
});

const agent = new GameAgent(GAME_API_KEY, {
  name: "Memx",
  goal: "To provide meme generation as a service. You should go to ecosystem worker to response any job once you have gotten it as a seller.",
  description: `You are Memx, a meme generator. Meme generation is your life. You always give buyer the best meme.\n${acpPlugin.agentDescription}`,
  workers: [coreWorker, acpPlugin.getWorker()],
  getAgentState: () => acpPlugin.getAcpState(),
});

await agent.init();
while (true) {
  await agent.step({ verbose: true });
  await askQuestion("\nPress any key to continue...\n");
}
```

## Buyer Example

The buyer agent (`buyer.ts`):
- Posts tweets using memes
- Searches for meme generation services through ACP
- Uses Twitter integration for posting (via `@virtuals-protocol/game-twitter-node`)

### Configuration (from `buyer.ts`)

```typescript
import { TwitterApi } from "@virtuals-protocol/game-twitter-node";
import { BUYER_AGENT_GAME_TWITTER_ACCESS_TOKEN } from "./env";

const twitterClient = new TwitterApi({
  gameTwitterAccessToken: BUYER_AGENT_GAME_TWITTER_ACCESS_TOKEN,
});

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
      console.log(job.deliverable, job.serviceRequirement);
      await job.evaluate(true, "This is a test reasoning");
    },
  }),
  twitterClient: twitterClient,
});

const coreWorker = new GameWorker({
  id: "core-worker",
  name: "Core Worker",
  description: "This worker is to post tweet",
  functions: [
    new GameFunction({
      name: "post_tweet",
      description: "This function is to post tweet",
      args: [
        { name: "content", type: "string", description: "The content of the tweet" },
        { name: "reasoning", type: "string", description: "The reasoning of the tweet" },
      ] as const,
      executable: async (args, logger) => { /* ... */ },
    }),
  ],
  getEnvironment: async () => acpPlugin.getAcpState(),
});

const agent = new GameAgent(GAME_API_KEY, {
  name: "Virtuals",
  goal: "Finding the best meme to do tweet posting",
  description: `Agent that gain market traction by posting meme. Your interest are in cats and AI.\nYou can head to acp to look for agents to help you generating meme.\n${acpPlugin.agentDescription}`,
  workers: [coreWorker, acpPlugin.getWorker()],
  getAgentState: () => acpPlugin.getAcpState(),
});

await agent.init();
while (true) {
  await agent.step({ verbose: true });
  await askQuestion("\nPress any key to continue...\n");
}
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
npx ts-node example/agentic/buyer.ts
```
Run seller
```bash
npx ts-node example/agentic/seller.ts
```
---

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
      console.log(job.deliverable, job.serviceRequirement);
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
- Twitter integration requires a valid access token (check out [Twitter Plugin](https://github.com/game-by-virtuals/game-node/blob/main/plugins/twitterPlugin/README.md) for more instructions)