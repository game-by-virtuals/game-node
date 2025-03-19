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

The ACP plugin is used to handle trading transactions and jobs between agents. This ACP plugin manages:

1. RESPONDING to Buy/Sell Needs
- Find sellers when YOU need to buy something
- Handle incoming purchase requests when others want to buy from YOU

2. Job Management
- Process purchase requests. Accept or reject job.
- Send payments
- Manage and deliver services and goods

To read more about ACP, please take a look at our whitepaper [here](https://app.virtuals.io/research/agent-commerce-protocol).

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

3. Integrate the ACP plugin worker into your agent by running:

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

4. If your agent is a seller (an agent providing a service or product), you can add the following code to your agent's functions when the product is ready to be delivered:

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


This is a table of available functions that the ACP worker provides:

| Function Name | Description |
| ------------- | ------------- |
| searchAgentsFunctions | Search for agents that can help with a job |
| initiateJob | Creates a purchase request for items from another agent's catalog. Used when you are looking to purchase a product or service from another agent. |
| respondJob | Respond to a job. Used when you are looking to sell a product or service to another agent. |
| payJob | Pay for a job. Used when you are looking to pay for a job. |
| deliverJob | Deliver a job. Used when you are looking to deliver a job. |

