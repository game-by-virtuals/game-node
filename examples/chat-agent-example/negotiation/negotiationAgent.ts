import { ChatAgent } from "../../../src/chatAgent";
import GameFunction from "../../../src/function";

export enum NegotiationState {
  INITIAL = "initial",
  NEGOTIATING = "negotiating",
  ACCEPTED = "accepted",
  REJECTED = "rejected"
}

export interface NegotiationTerms {
  quantity: number;
  pricePerUnit: number;
  requirements: string;
}

export class NegotiationAgent {
  private chatAgent: ChatAgent;
  private chat: any = null;
  private state: NegotiationState = NegotiationState.INITIAL;
  private terms: NegotiationTerms | null = null;
  private negotiationFunctions: GameFunction<any>[];

  constructor(
    apiKey: string,
    systemPrompt: string,
    public readonly agentId: string,
    negotiationFunctions: GameFunction<any>[]
  ) {
    this.chatAgent = new ChatAgent(apiKey, systemPrompt);
    this.negotiationFunctions = negotiationFunctions;
  }

  async initialize(partnerId: string, partnerName: string): Promise<void> {
    this.chat = await this.chatAgent.createChat({
      partnerId,
      partnerName,
      actionSpace: this.negotiationFunctions,
    });
  }

  async sendMessage(message: string): Promise<any> {
    if (!this.chat) {
      throw new Error("Agent not initialized");
    }

    try {
      const response = await this.chat.next(message);
      
      // Update state based on function calls
      if (response.functionCall) {
        const args = response.functionCall.args || {};
        
        if (response.functionCall.fn_name === "accept_deal") {
          this.state = NegotiationState.ACCEPTED;
        } else if (response.functionCall.fn_name === "reject_deal") {
          this.state = NegotiationState.REJECTED;
        } else if (response.functionCall.fn_name === "propose_deal" || 
                  response.functionCall.fn_name === "counter_offer") {
          this.state = NegotiationState.NEGOTIATING;
          
          // Extract values without defaults
          const terms: Partial<NegotiationTerms> = {};
          
          if (args.quantity) {
            terms.quantity = parseInt(args.quantity);
          }
          
          if (args.price_per_unit) {
            terms.pricePerUnit = parseInt(args.price_per_unit);
          }
          
          if (args.requirements) {
            terms.requirements = args.requirements;
          }
          
          // Try to extract missing values from message
          if (response.message) {
            if (terms.pricePerUnit === undefined) {
              const priceMatch = response.message.match(/\$(\d+)|\b(\d+)\s+per\b/);
              if (priceMatch) {
                terms.pricePerUnit = parseInt(priceMatch[1] || priceMatch[2]);
                console.log(`[${this.agentId}] Extracted price from message: $${terms.pricePerUnit}`);
              }
            }
            
            if (terms.quantity === undefined) {
              const quantityMatch = response.message.match(/\b(\d+)\s+items?\b|\b(\d+)\s+posts?\b/);
              if (quantityMatch) {
                terms.quantity = parseInt(quantityMatch[1] || quantityMatch[2]);
                console.log(`[${this.agentId}] Extracted quantity from message: ${terms.quantity}`);
              }
            }
          }
          
          // Update terms if we have any values
          if (Object.keys(terms).length > 0) {
            this.updateTerms(terms);
          }
        }
      }
      
      return response;
    } catch (error) {
      console.error(`Error from ${this.agentId}:`, error);
      throw error;
    }
  }

  // Method to manually update terms (used by manager)
  updateTerms(terms: Partial<NegotiationTerms>): void {
    // Create a new terms object or update existing one
    if (!this.terms) {
      this.terms = {} as NegotiationTerms;
    }
    
    // Only update fields that are provided
    if (terms.quantity !== undefined) this.terms.quantity = terms.quantity;
    if (terms.pricePerUnit !== undefined) this.terms.pricePerUnit = terms.pricePerUnit;
    if (terms.requirements !== undefined) this.terms.requirements = terms.requirements;
    
    this.state = NegotiationState.NEGOTIATING;
    console.log(`[${this.agentId}] Terms updated:`, this.terms);
  }

  getState(): NegotiationState {
    return this.state;
  }

  getTerms(): NegotiationTerms | null {
    return this.terms;
  }
}