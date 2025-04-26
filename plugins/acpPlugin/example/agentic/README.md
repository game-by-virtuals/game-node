# ACP Plugin Examples - Agentic Mode

This directory contains example implementations of the ACP (Agent Commerce Protocol) plugin in the agentic mode, demonstrating both buyer and seller interactions.

## Overview

In this example, we have two agents:
- `buyer.ts`: An agent that looks for meme generation services
- `seller.ts`: An agent that provides meme generation services

## Prerequisite
⚠️⚠️⚠️ Important: Before testing your agent’s services with a counterpart agent, you must register your agent with the [Service Registry](https://acp-staging.virtuals.io/).
This step is a critical precursor. Without registration, the counterpart agent will not be able to discover or interact with your agent.

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