import { NegotiationAgent } from "./negotiationAgent";
import { NegotiationManager } from "./negotiationManager";
import GameFunction, { ExecutableGameFunctionResponse, ExecutableGameFunctionStatus } from "../../../src/function";

// Make sure you have your API key
const apiKey = process.env.GAME_API_KEY || "";
if (!apiKey) {
  throw new Error("GAME_API_KEY is not set");
}

// Define negotiation functions
const negotiationFunctions: GameFunction<any>[] = [
  new GameFunction({
    name: "propose_deal",
    description: "Propose terms for a deal",
    args: [
      { name: "quantity", description: "Number of items" },
      { name: "price_per_unit", description: "Price per unit in USD" },
      { name: "requirements", description: "Specific requirements for the job" }
    ],
    executable: async (args) => {
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done, 
        `Proposed deal: ${args.quantity || 5} items at $${args.price_per_unit || 150} each. Requirements: ${args.requirements || "standard quality"}`
      );
    }
  }),
  new GameFunction({
    name: "counter_offer",
    description: "Make a counter offer",
    args: [
      { name: "quantity", description: "Number of items" },
      { name: "price_per_unit", description: "Price per unit in USD" },
      { name: "requirements", description: "Specific requirements for the job" },
      { name: "reason", description: "Reason for the counter offer" }
    ],
    executable: async (args) => {
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done, 
        `Counter offer: ${args.quantity || 5} items at $${args.price_per_unit || 130} each. Requirements: ${args.requirements || "standard quality"}. Reason: ${args.reason || "to better reflect market value"}`
      );
    }
  }),
  new GameFunction({
    name: "accept_deal",
    description: "Accept the current terms",
    args: [],
    executable: async () => {
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done, 
        "Deal accepted!"
      );
    }
  }),
  new GameFunction({
    name: "reject_deal",
    description: "Reject the deal and end negotiation",
    args: [{ name: "reason", description: "Reason for rejection" }],
    executable: async (args) => {
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done, 
        `Deal rejected. Reason: ${args.reason || "terms are not acceptable"}`
      );
    }
  })
];

async function runNegotiation() {
  console.log("Starting negotiation between Buyer and Seller...");
  
  // Create buyer agent
  const buyerAgent = new NegotiationAgent(
    apiKey,
    "You are a professional buyer looking to purchase content creation services. You are budget-conscious but value quality. Your goal is to negotiate the best possible deal within your budget constraints. You should start with a lower offer and be willing to compromise, but don't accept deals above your maximum price of $150 per post.",
    "buyer-agent",
    negotiationFunctions
  );
  
  // Create seller agent
  const sellerAgent = new NegotiationAgent(
    apiKey,
    "You are a professional content creator selling your services. You value fair compensation for quality work. Your goal is to negotiate the best possible deal that reflects the value of your work. You should start with a higher price and be willing to compromise, but don't accept deals below your minimum price of $120 per post.",
    "seller-agent",
    negotiationFunctions
  );
  
  // Initialize agents
  await buyerAgent.initialize("seller-agent", "Content Creator");
  await sellerAgent.initialize("buyer-agent", "Potential Client");
  
  // Create negotiation manager
  const manager = new NegotiationManager();
  
  // Register negotiation with a 20-turn limit
  const negotiationId = `neg-${Date.now()}`;
  manager.registerNegotiation(negotiationId, [buyerAgent, sellerAgent], 20);
  
  // Initial message from buyer
  const initialMessage = "I'm looking for someone to write 5 blog posts about AI technology. Each post should be around 1000-1500 words with proper research and citations. What would be your price for this project?";
  
  // Run the negotiation
  const result = await manager.runNegotiation(negotiationId, "buyer-agent", initialMessage);
  
  // Print summary
  console.log("\n=== NEGOTIATION SUMMARY ===");
  console.log(`Turns completed: ${result.turns}`);
  
  for (const [agentId, agentData] of Object.entries(result.agents)) {
    const data = agentData as { state: string; terms: any };
    console.log(`\n${agentId} final state: ${data.state}`);
    if (data.terms) {
      console.log(`${agentId} terms:`, data.terms);
    }
  }
  return result;
}

// Run the negotiation
runNegotiation().catch(console.error);