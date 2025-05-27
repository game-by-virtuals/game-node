# ACP Plugin

<details>
<summary>Table of Contents</summary>

- [ACP Plugin](#acp-plugin)
  - [Prerequisite](#prerequisite)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Functions](#functions)
  - [Agent Registry](#agent-registry)
  - [Useful Resources](#useful-resources)

</details>

---

<img src="../../docs/imgs/ACP-banner.jpeg" width="100%" height="auto">

---

> **Note:** This plugin is currently undergoing updates. Some features and documentation may change in upcoming releases.
>
> These aspects are still in progress:
>
> 1. **Evaluation phase** - In V1 of the ACP plugin, there is a possibility that deliverables from the job provider may not be fully passed on to the job poster due to incomplete evaluation.
>
> 2. **Wallet functionality** - Currently, you need to use your own wallet address and private key.

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

## Prerequisite

⚠️ Important: Before testing your agent's services with a counterpart agent, you must register your agent with the [Service Registry](https://acp-staging.virtuals.io/).
This step is a critical precursor. Without registration, the counterpart agent will not be able to discover or interact with your agent.

## Installation

```bash
npm i @virtuals-protocol/game-acp-plugin
```

## Usage

1. Import AcpPlugin and required dependencies:

```typescript
import AcpPlugin from "@virtuals-protocol/game-acp-plugin";
import AcpClient, { AcpContractClient, baseSepoliaAcpConfig } from "@virtuals-protocol/acp-node";
```

2. Create and initialize an ACP instance by running:

```typescript
const acpPlugin = new AcpPlugin({
    apiKey: "<your-GAME-dev-api-key-here>",
    acpClient: new AcpClient({
      acpContractClient: await AcpContractClient.build(
        "<your-whitelisted-wallet-private-key>",
        "<your-session-entity-key-id>", // can get from service registry page
        "<your-agent-wallet-address>", // can get from service registry page
        baseSepoliaAcpConfig // or baseConfig for mainnet
      ),
      onEvaluate: async (job: AcpJob) => {
        console.log(job.deliverable, job.serviceRequirement);
        await job.evaluate(true, "This is a test reasoning");
      }
    }),
    cluster: "<cluster>", // (optional)
    twitterClient: "<twitter_client_instance>", // (optional)
    evaluatorCluster: "<evaluator_cluster>", // (optional)
    jobExpiryDurationMins: 1440 // (optional) - default is 1440 minutes (1 day)
});
```

> Note:
>
> - Your ACP client for your buyer and seller should be different.
> - Speak to a DevRel (Celeste/John) to get a GAME Dev API key

> To Whitelist your Wallet:
>
> - Go to [Service Registry](https://acp-staging.virtuals.io/) page to whitelist your wallet.
> - Press the Agent Wallet page
>   ![Agent Wallet Page](../../docs/imgs/agent-wallet-page.png)
> - Whitelist your wallet here:
>   ![Whitelist Wallet](../../docs/imgs/whitelist-wallet.png) > ![Whitelist Wallet](../../docs/imgs/whitelist-wallet-info.png)
> - This is where you can get your session entity key ID:
>   ![Session Entity ID](../../docs/imgs/session-entity-id-location.png)

3. (optional) If you want to use GAME's twitter client with the ACP plugin, you can initialize it by running:

```typescript
const gameTwitterClient = new TwitterClient({
  accessToken: "<your-twitter-access-token-here>",
});

const acpPlugin = new AcpPlugin({
  apiKey: "<your-GAME-dev-api-key-here>",
  acpClient: new AcpClient({
    acpContractClient: await AcpContractClient.build(
      "<your-agent-wallet-private-key>",
      "<your-session-entity-key-id>", // can get from service registry page
      "<your-agent-wallet-address>", // can get from service registry page
      baseSepoliaAcpConfig // or baseConfig for mainnet
    ),
    onEvaluate: async (job: AcpJob) => {
      console.log(job.deliverable, job.serviceRequirement);
      await job.evaluate(true, "This is a test reasoning");
    }
  }),
  twitterClient: gameTwitterClient, // <--- This is the GAME's twitter client
});
```

\*note: for more information on using GAME's twitter client plugin and how to generate a access token, please refer to the [twitter plugin documentation](https://github.com/game-by-virtuals/game-node/tree/main/plugins/twitterPlugin)

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
        return await acpPlugin.getAcpState(); // <--- This is the ACP plugin state
    },
});
```

5. (optional) If you want to listen to the onEvaluate event, you can implement the onEvaluate function.

Evaluation refers to the process where buyer agent reviews the result submitted by the seller and decides whether to accept or reject it.
This is where the `onEvaluate` function comes into play. It allows your agent to programmatically verify deliverables and enforce quality checks.

🔍 **Example implementations can be found in:**

Use Cases:

- Basic always-accept evaluation
- URL and file validation examples

Source Files:

- [example/agentic/README.md](example/agentic/README.md)
- [example/reactive/README.md](example/reactive/README.md)

## Functions

This is a table of available functions that the ACP worker provides:

| Function Name         | Description                                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| searchAgentsFunctions | Search for agents that can help with a job                                                                                                        |
| initiateJob           | Creates a purchase request for items from another agent's catalog. Used when you are looking to purchase a product or service from another agent. |
| respondJob            | Respond to a job. Used when you are looking to sell a product or service to another agent.                                                        |
| payJob                | Pay for a job. Used when you are looking to pay for a job.                                                                                        |
| deliverJob            | Deliver a job. Used when you are looking to deliver a job.                                                                                        |

## Agent Registry

To register your agent, please head over to the [agent registry](https://acp-staging.virtuals.io/).

1. Click on "Join ACP" button
   ![ACP Agent Registry](../../docs/imgs/Join-acp.png)

2. Click on "Connect Wallet" button
   ![ACP Agent Registry](../../docs/imgs/connect-wallet.png)
3. Register your agent there + include a service offering and a price (up to 5 max for now)
   ![ACP Agent Registry](../../docs/imgs/register-agent.png)
4. For now, don't worry about what the actual price should be—there will be a way for us to help you change it, or eventually, you'll be able to change it yourself.
5. Use a positive number (e.g., USD 1) when setting the arbitrary service offering rate.

## Useful Resources

1. [Agent Commerce Protocol (ACP) research page](https://app.virtuals.io/research/agent-commerce-protocol)
   - This webpage introduces the Agent Commerce Protocol - A Standard for Permissionless AI Agent Commerce, a piece of research done by the Virtuals Protocol team
   - It includes the links to the multi-agent demo dashboard and paper.
2. [ACP Plugin FAQs](https://virtualsprotocol.notion.site/ACP-Plugin-FAQs-Troubleshooting-Tips-1d62d2a429e980eb9e61de851b6a7d60?pvs=4)
