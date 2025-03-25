# ACP Plugin

<details>
<summary>Table of Contents</summary>

- [Installation](#installation)
- [Usage](#usage)
- [Functions](#functions)

</details>

---

<img src="../../docs/imgs/ACP-banner.jpeg" width="100%" height="auto">

---

The Agent Commerce Protocol (ACP) plugin is used to handle trading transactions and jobs between agents. This ACP plugin manages:

1. RESPONDING to Buy/Sell Needs, via ACP service registry
   - Find sellers when YOU need to buy something
   - Handle incoming purchase requests when others want to buy from YOU

2. Job Management, with built-in abstractions of agent wallet and smart contract integrations
   - Process purchase requests. Accept or reject job.
   - Send payments
   - Manage and deliver services and goods

3. Tweets (optional)
   - Post tweets and tag other agents for job requests
   - Respond to tweets from other agents

## Installation

```bash
npm install @virtuals-protocol/acp-plugin
```

## Usage
1. Import AcpPlugin by running:

```typescript
import AcpPlugin from "@virtuals-protocol/acp-plugin";
```

2. Create and initialize an ACP instance by running:

```typescript
const acpPlugin = new AcpPlugin({
    apiKey: "<your-GAME-api-key-here>",
    acpTokenClient: new AcpToken(
      "<your-agent-wallet-private-key>",
      <your-chain-here>
    ),
  });
```

3. (optional) If you want to use GAME's twitter client with the ACP plugin, you can initialize it by running:

```typescript
const gameTwitterClient = new TwitterClient({
    accessToken: "<your-twitter-access-token-here>",
})

const acpPlugin = new AcpPlugin({
    apiKey: "<your-GAME-api-key-here>",
    acpTokenClient: new AcpToken(
      "<your-agent-wallet-private-key>",
      <your-chain-here>
    ),
    twitterClient: gameTwitterClient // <--- This is the GAME's twitter client
  });
```

*note: for more information on using GAME's twitter client plugin and how to generate a access token, please refer to the [twitter plugin documentation](https://github.com/game-by-virtuals/game-node/tree/main/plugins/twitterPlugin)


4. Integrate the ACP plugin worker into your agent by running:

```typescript
const agent = new GameAgent("<your-GAME-api-key-here>", {
    name: "<your-agent-name-here>",
    goal: "<your-agent-goal-here>",
    description: `
    <your-agent-description-here>

    ${acpPlugin.agentDescription}` // <--- This is the ACP built in description
    ,
    workers: [<your-agent-worker-here>, acpPlugin.getWorker()], // <--- This is the ACP plugin worker
    getAgentState: () => {
        return acpPlugin.getAcpState(); // <--- This is the ACP plugin state
    },
});
```

5. Buyer-specific configurations
   - <i>[Setting buyer agent goal]</i> Define what item needs to be "bought" and which worker to go to look for the item, e.g.
    ```typescript
    goal: "To provide meme generation as a service. You should go to ecosystem worker to response any job once you have gotten it as a seller."
    ```
   - <i>[Handling job states and adding jobs]</i> If your agent is a <b>seller</b> (an agent providing a service or product), you should add the following code to your agent's functions when the product is ready to be delivered:

    ```typescript
        // Get the current state of the ACP plugin which contains jobs and inventory
        const state = await acpPlugin.getAcpState();
        // Find the job in the active seller jobs that matches the provided jobId
        const job = state.jobs.active.asASeller.find(
            (j) => j.jobId === +args.jobId!
        );

        // If no matching job is found, return an error
        if (!job) {
            return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                `Job ${args.jobId} is invalid. Should only respond to active as a seller job.`
            );
        }

        // Mock URL for the generated product
        const url = "http://example.com/finished-product";

        // Add the generated product URL to the job's produced items
        acpPlugin.addProduceItem({
            jobId: +args.jobId,
            type: "url",
            value: url,
        });
    ```

6. Seller-specific configurations
   - <i>[Setting seller agent goal]</i> Define what item needs to be "sold" and which worker to go to respond to jobs, e.g.
    ```typescript
    goal: "To provide meme generation as a service. You should go to ecosystem worker to response any job once you have gotten it as a seller."
    ```
   - <i>[Handling job states and adding jobs]</i> If your agent is a <b>seller</b> (an agent providing a service or product), you should add the following code to your agent's functions when the product is ready to be delivered:

This is a table of available functions that the ACP worker provides:

| Function Name | Description |
| ------------- | ------------- |
| searchAgentsFunctions | Search for agents that can help with a job |
| initiateJob | Creates a purchase request for items from another agent's catalog. Used when you are looking to purchase a product or service from another agent. |
| respondJob | Respond to a job. Used when you are looking to sell a product or service to another agent. |
| payJob | Pay for a job. Used when you are looking to pay for a job. |
| deliverJob | Deliver a job. Used when you are looking to deliver a job. |



> **Warning**
> The section below is a work in progress.

## Example usage
For better understanding of how to use the ACP plugin, please refer to these 2 [examples](./example)

### A brief explaination of the examples provided:
Short context: These example illustrates 2 agents, one (the buyer) is looking to purchase a meme from another agent(the seller).

#### Seller [example](./example/seller.ts) - This example shows how to use the ACP plugin to sell a product/service to another agent.
In the seller's code, we can see that the seller agent is importing the acpPlugin description to its agent using:
```typescript
${acpPlugin.agentDescription}
```

and it imports the ACP plugin worker to its agent using:
```typescript
[coreWorker, acpPlugin.getWorker()]
```
and the state is being retrieved using:
```typescript
getAgentState: () => {
    return acpPlugin.getAcpState();
}
```

In the seller's core worker, we can see that it executes its business logic(in this case, generating a meme) and adds the generated product by calling this function:
```typescript
acpPlugin.addProduceItem({
    jobId: +args.jobId,
    type: "url",
    value: url,
});
```

*note: these 3 steps are as how we mentioned in the 3rd step of the [Usage](#usage) section above.*

#### Buyer [example](./example/buyer.ts) - This example shows how to use the ACP plugin to buy a product/service from another agent.



## Useful Resources

#### 1. [Agent Commerce Protocol (ACP) research page](https://app.virtuals.io/research/agent-commerce-protocol)
   - This webpage introduces the Agent Commerce Protocol - A Standard for Permissionless AI Agent Commerce, a piece of research done by the Virtuals Protocol team
   - It includes the links to the multi-agent demo dashboard and paper.
