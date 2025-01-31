import { GameAgent } from "@virtuals-protocol/game";
import AproPlugin from "../src";
import { describe, it } from "vitest";

describe("AproPlugin", async () => {
  const aproPlugin = new AproPlugin({
    credentials: {
      proxyAddress: process.env.PROXY_ADDRESS!,
      privateKey: process.env.PRIVATE_KEY!,
      rpcUrl: process.env.RPC_URL!,
    }
  });

  const agent = new GameAgent(process.env.AGENT_API_KEY!, {
    name: "Apro Bot",
    goal: `You are a bot that can create agents, verify data, and query price data.`,
    description: "A bot that can create agents, verify data, and query price data",
    workers: [
      aproPlugin.getWorker({}),
    ],
  });

  agent.setLogger((agent, message) => {
    console.log(`-----[${agent.name}]-----`);
    console.log(message);
    console.log("\n");
  });

  await agent.init();
  const agentWorker = agent.getWorkerById('apro_worker')

  it('should fetch price data', async () => {
    // Given
    const task = `fetch the price data with following sourceAgentId and feedId
      sourceAgentId:b660e3f4-bbfe-4acb-97bd-c0869a7ea142
      feedId:0x0003665949c883f9e0f6f002eac32e00bd59dfe6c34e92a91c37d6a8322d6489
    `

    // When
    await agentWorker.runTask(task, {verbose: true});

    // Then
  })

  it('should create an agent', async () => {
    // Given
    const task = `create an agent with the following data
    {
      signers: [
        '0x003CD3bD8Ac5b045be8E49d4dfd9928E1765E471',
        '0xdE3701195b9823E41b3fc2c98922A94399E2a01C',
        '0xB54E5D4faa950e8B6a01ed5a790Ac260c81Ad224',
        '0x48eE063a6c67144E09684ac8AD9a0044836f348B',
        '0xbBbCc052F1277dd94e88e8E5BD6D7FF9a29BaC98'
      ],
      threshold: 3,
      converterAddress: "0x24c36e9996eb84138Ed7cAa483B4c59FF7640E5C",
      agentHeader: {
        sourceAgentName: 'Game Test Agent',
        targetAgentId: '1105302c-7556-49b2-b6fe-3aedba9c0682',
        messageType: 0,
        priority: 1,
        ttl: 3600,
      },
    }`

    // When
    await agentWorker.runTask(task, {verbose: true});
  })

  it('should verify data', async () => {
    // Given
    const task = `verify the data with the following data
    {
	  "agentAddress": "0x5E02B2239c0f0DCBf4b261aC031C8fdDE57bFcd3",
    "configDigest": "0x01003F4CED5B184D15C906578976ECAD07FF180F9D096770CE39FF37F8FD802A",
    "payload": {
        data: "0x48656c6c6f20576f726c6421",
        dataHash: "0x3ea2f1d0abf3fc66cf29eebb70cbd4e7fe762ef8a09bcc06c8edf641230afec0",
        signatures: [
          {
            r: '944077ec69cbba1a1ca86556c51786ab7cb0b7769c09fd135613817e00f01707',
            s: '6c53ba26ec3db0ff48d00084414a2ae89af470ca4b65805794b2cb11409b616c',
            v: 28, // or 1
          },
          {
            r: '079570c191da21106916d1b2badec3866693f1c33fca8e593d13c006b8f2f8b3',
            s: '2f1747b281585d62894605e354355f8c4b53c805162939fa1b71bde2dd5747da',
            v: 27, // or 0
          },
          {
            r: 'de592b3b7b50fd0eaebb943109e67165f3858034599debccaf99a11f42f31704',
            s: '713bd639340928b4df4d50d39b39e7c61859b3894c6549e8b075210e2604d9b4',
            v: 28, // or 1
          },
        ],
      }
    }`

    // When
    await agentWorker.runTask(task, {verbose: true});
  })
})
