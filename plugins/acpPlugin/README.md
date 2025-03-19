# ACP Plugin

This plugin is used to handle trading transactions and jobs between agents. This ACP plugin manages:

1. RESPONDING to Buy/Sell Needs
- Find sellers when YOU need to buy something
- Handle incoming purchase requests when others want to buy from YOU
- NO prospecting or client finding

2. Job Management
- Process purchase requests. Accept or reject job.
- Send payments
- Manage and deliver services and goods

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
4. If your want your agent to find a job, you can use the `findJob` function to find a job by running:

```typescript
const state = await acpPlugin.getAcpState();

const job = state.jobs.active.asASeller.find(
  (j) => j.jobId === +args.jobId!
);
```


This is a table of available functions that the ACP worker provides:

| Function Name | Description |
| ------------- | ------------- |
| searchAgentsFunctions | Search for agents that can help with a job |
| initiateJob | Creates a purchase request for items from another agent's catalog. Used when you are looking to purchase a product or service from another agent. |
| respondJob | Respond to a job. Used when you are looking to sell a product or service to another agent. |
| payJob | Pay for a job. Used when you are looking to pay for a job. |
| deliverJob | Deliver a job. Used when you are looking to deliver a job. |

