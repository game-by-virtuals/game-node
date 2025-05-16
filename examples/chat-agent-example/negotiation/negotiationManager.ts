import { NegotiationAgent, NegotiationState } from "./negotiationAgent";

export interface MessageFormatter {
  formatFunctionCall(functionCall: any): string;
}

// Default generic formatter that doesn't use domain-specific language
export class DefaultMessageFormatter implements MessageFormatter {
  formatFunctionCall(functionCall: any): string {
    if (!functionCall) return "No response";
    
    const args = functionCall.args || {};
    
    switch (functionCall.fn_name) {
      case "propose_deal": {
        const quantity = args.quantity ? `${args.quantity}` : "a number of";
        const price = args.price_per_unit ? `$${args.price_per_unit}` : "a price";
        const requirements = args.requirements || "certain specifications";
        return `I propose a deal for ${quantity} items at ${price} each. Requirements: ${requirements}`;
      }
      
      case "counter_offer": {
        const quantity = args.quantity ? `${args.quantity}` : "a number of";
        const price = args.price_per_unit ? `$${args.price_per_unit}` : "a different price";
        const requirements = args.requirements || "certain specifications";
        const reason = args.reason || "specific reasons";
        return `I counter-offer ${quantity} items at ${price} each. Requirements: ${requirements}. Reason: ${reason}`;
      }
      
      case "accept_deal":
        return "I accept the deal.";
      
      case "reject_deal": {
        const reason = args.reason || "specific reasons";
        return `I reject the deal because ${reason}.`;
      }
      
      default:
        return `Function call: ${functionCall.fn_name}`;
    }
  }
}

export class NegotiationManager {
  private negotiations: Map<string, {
    agents: NegotiationAgent[];
    transcript: Array<{
      from: string;
      message?: string;
      functionCall?: any;
      timestamp: number;
    }>;
    turns: number;
    maxTurns: number;
    messageFormatter: MessageFormatter;
  }> = new Map();

  registerNegotiation(
    negotiationId: string,
    agents: NegotiationAgent[],
    maxTurns: number = 20,
    messageFormatter: MessageFormatter = new DefaultMessageFormatter()
  ): void {
    this.negotiations.set(negotiationId, {
      agents,
      transcript: [],
      turns: 0,
      maxTurns,
      messageFormatter
    });
  }

  async runNegotiation(
    negotiationId: string,
    initialAgentId: string,
    initialMessage: string
  ): Promise<any> {
    const negotiation = this.negotiations.get(negotiationId);
    if (!negotiation) {
      throw new Error(`Negotiation ${negotiationId} not found`);
    }

    // Add initial message to transcript
    negotiation.transcript.push({
      from: initialAgentId,
      message: initialMessage,
      timestamp: Date.now()
    });

    console.log(`\n[${initialAgentId}]: ${initialMessage}`);

    let currentMessage = initialMessage;
    let currentAgentId = initialAgentId;
    let isActive = true;

    // Get all agent IDs
    const agentIds = negotiation.agents.map(agent => agent.agentId);
    
    while (negotiation.turns < negotiation.maxTurns && isActive) {
      // Get next agent in rotation
      const currentAgentIndex = agentIds.indexOf(currentAgentId);
      const nextAgentIndex = (currentAgentIndex + 1) % agentIds.length;
      const nextAgentId = agentIds[nextAgentIndex];
      const nextAgent = negotiation.agents.find(agent => agent.agentId === nextAgentId);

      if (!nextAgent) {
        throw new Error(`Agent ${nextAgentId} not found`);
      }

      console.log(`\n--- TURN ${negotiation.turns + 1} ---`);
      console.log(`Waiting for ${nextAgentId} response...`);

      try {
        // Get response from next agent
        const response = await nextAgent.sendMessage(currentMessage);

        // Log response
        if (response.message) {
          console.log(`\n[${nextAgentId}]: ${response.message}`);
          negotiation.transcript.push({
            from: nextAgentId,
            message: response.message,
            timestamp: Date.now()
          });
        }

        // Handle function calls
        if (response.functionCall) {
          console.log(`\n[${nextAgentId} function call: ${response.functionCall.fn_name}]`);
          console.log(JSON.stringify(response.functionCall.args || {}, null, 2));

          // Extract values from message if not in args
          const args = response.functionCall.args || {};
          let pricePerUnit = args.price_per_unit ? parseInt(args.price_per_unit) : undefined;
          let quantity = args.quantity ? parseInt(args.quantity) : undefined;
          
          // Try to extract missing values from message
          if (response.message) {
            if (pricePerUnit === undefined) {
              const priceMatch = response.message.match(/\$(\d+)|\b(\d+)\s+per\b/);
              if (priceMatch) {
                pricePerUnit = parseInt(priceMatch[1] || priceMatch[2]);
                console.log(`Extracted price from message: $${pricePerUnit}`);
              }
            }
            
            if (quantity === undefined) {
              const quantityMatch = response.message.match(/\b(\d+)\s+items?\b|\b(\d+)\s+pieces?\b|\b(\d+)\s+units?\b/);
              if (quantityMatch) {
                quantity = parseInt(quantityMatch[1] || quantityMatch[2] || quantityMatch[3]);
                console.log(`Extracted quantity from message: ${quantity}`);
              }
            }
          }
          
          // Create terms object with only the values we have
          const terms: any = {};
          if (quantity !== undefined) terms.quantity = quantity;
          if (pricePerUnit !== undefined) terms.pricePerUnit = pricePerUnit;
          if (args.requirements) terms.requirements = args.requirements;
          
          // Only update if we have at least one valid term
          if (Object.keys(terms).length > 0 && 
             (response.functionCall.fn_name === "propose_deal" || 
              response.functionCall.fn_name === "counter_offer")) {
            nextAgent.updateTerms(terms);
          }

          negotiation.transcript.push({
            from: nextAgentId,
            functionCall: response.functionCall,
            timestamp: Date.now()
          });

          // Check if negotiation has ended
          if (response.functionCall.fn_name === "accept_deal" || 
              response.functionCall.fn_name === "reject_deal") {
            console.log(`\nNegotiation ended by ${nextAgentId}`);
            isActive = false;
            break;
          }
        }

        // Prepare message for next turn using the domain-specific formatter
        currentMessage = response.message || 
                         negotiation.messageFormatter.formatFunctionCall(response.functionCall);
        currentAgentId = nextAgentId;

        // Increment turn counter after each agent response
        negotiation.turns++;
      } catch (error: any) {
        // Check if this is a "conversation finished" error
        if (error.response?.data?.detail?.includes('is finished')) {
          console.log(`\nNegotiation ended: Conversation is finished`);
          isActive = false;
        } else {
          console.error("Error during negotiation:", error);
          isActive = false;
        }
      }
    }

    // Check if we reached max turns
    if (negotiation.turns >= negotiation.maxTurns && isActive) {
      console.log("\nNegotiation reached maximum number of turns without resolution.");
    }

    return {
      negotiationId,
      transcript: negotiation.transcript,
      turns: negotiation.turns,
      agents: Object.fromEntries(
        negotiation.agents.map(agent => [
          agent.agentId,
          {
            state: agent.getState(),
            terms: agent.getTerms()
          }
        ])
      )
    };
  }

  getTranscript(negotiationId: string): any[] {
    const negotiation = this.negotiations.get(negotiationId);
    if (!negotiation) {
      throw new Error(`Negotiation ${negotiationId} not found`);
    }
    return negotiation.transcript;
  }
}