// import { Anthropic } from "@anthropic-ai/sdk";
// import {
//   MessageParam,
//   Tool,
// } from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
// import readline from "readline/promises";
// import dotenv from "dotenv";


// dotenv.config();


// Example usage
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
  }
  
  async connectToServer() {
    try {
    //   this.transport = new StdioClientTransport({
    //     command: "/usr/local/bin/docker",
    //     args: [
    //         "run",
    //         "-i",
    //         "--rm",
    //         "-e",
    //         "BRAVE_API_KEY",
    //         "mcp/brave-search"
    //     ],
    //     env: {
    //         "BRAVE_API_KEY": ""
    //     }
    //   });
      this.transport = new StdioClientTransport({
          command: this.command,
          args: this.args,
          env: this.env
      });
      this.mcp.connect(this.transport);
  
    //   const toolsResult = await this.mcp.listTools();
      


    } catch (e) {
      console.log("Failed to connect to MCP server: ", e);
      throw e;
    }
  }

   async getTools() {
    return await this.mcp.listTools();
  }

  async callTool(name: string, args: Record<string, any>) {
    return await this.mcp.callTool({
      name,
      arguments: args
    });
  }

//   async processQuery(query: string) {
//     const messages: MessageParam[] = [
//       {
//         role: "user",
//         content: query,
//       },
//     ];
  
//     const response = await this.anthropic.messages.create({
//       model: "claude-3-5-sonnet-20241022",
//       max_tokens: 1000,
//       messages,
//       tools: this.tools,
//     });
  
//     const finalText = [];
//     const toolResults = [];
  
//     for (const content of response.content) {
//       if (content.type === "text") {
//         finalText.push(content.text);
//       } else if (content.type === "tool_use") {
//         const toolName = content.name;
//         const toolArgs = content.input as { [x: string]: unknown } | undefined;
  
//         const result = await this.mcp.callTool({
//           name: toolName,
//           arguments: toolArgs,
//         });
//         toolResults.push(result);
//         finalText.push(
//           `[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`
//         );
  
//         messages.push({
//           role: "user",
//           content: result.content as string,
//         });
  
//         const response = await this.anthropic.messages.create({
//           model: "claude-3-5-sonnet-20241022",
//           max_tokens: 1000,
//           messages,
//         });
  
//         finalText.push(
//           response.content[0].type === "text" ? response.content[0].text : ""
//         );
//       }
//     }
  
//     return finalText.join("\n");
//   }
  
  async cleanup() {
    await this.mcp.close();
  }
}

export default McpClient;
export type { IMcpClientOptions };
