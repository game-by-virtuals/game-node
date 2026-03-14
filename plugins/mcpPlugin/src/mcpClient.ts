import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";



interface IMcpClientOptions {
    command: string;
    args: string[];
    env: Record<string, string>;
}


class McpClient {
  private command: string;
  private args: string[];
  private env: Record<string, string>;
  private mcp: Client;
  private transport: StdioClientTransport | null = null;
  

  constructor(options: IMcpClientOptions) {
    this.command = options.command;
    this.args = options.args;
    this.env = options.env;

    this.mcp = new Client({ 
        name: "mcp-client-cli", 
        version: "1.0.0" 
    });

    this.connectToServer();
  }
  

  async connectToServer() {
    try {
      this.transport = new StdioClientTransport({
          command: this.command,
          args: this.args,
          env: this.env
      });
      this.mcp.connect(this.transport);  
      
    } catch (e) {
      console.log("Failed to connect to MCP server: ", e);
      throw e;
    }
  }


  async getTools() {
    // TODO: Implement error handling
    return await this.mcp.listTools();
  }


  async callTool(name: string, args: Record<string, any>) {
    // TODO: Implement error handling
    return await this.mcp.callTool({
      name,
      arguments: args
    });
  }


  async cleanup() {
    await this.mcp.close();
  }
}


export default McpClient;
export type { IMcpClientOptions };
