import {
    GameWorker,
    GameFunction,
    ExecutableGameFunctionResponse,
    ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";
import McpClient, { IMcpClientOptions } from "./mcpClient";

// Example usage
interface IMcpPluginOptions {
    id: string;
    name: string;
    description: string;
    mcpClientConfiguration: IMcpClientOptions;
}

class McpPlugin {
    private id: string;
    private name: string;
    private description: string;
    private mcpClientConfiguration: IMcpClientOptions;

    private mcpClient: McpClient;
    // private mcpClientTransport: StdioClientTransport || ;
    private mcpFunctions: GameFunction<any>[];

    constructor(options: IMcpPluginOptions) {
        this.id = options.id;
        this.name = options.name;
        this.description = options.description;
        
        // Initialize the MCP client
        this.mcpClientConfiguration = options.mcpClientConfiguration;
        this.mcpClient = new McpClient(this.mcpClientConfiguration);
        this.mcpFunctions = [];
        
        // Populate the MCP functions for this client
        this.getMcpFunctions().then(funcs => {
            this.mcpFunctions = funcs;
        });
    }

    private async getMcpFunctions() {
        const toolsResult = await this.mcpClient.getTools();

        // TODO: Implement error handling
        for (const tool of toolsResult.tools) {

            // brave_web_search
            const name = tool.name;
            // Performs a web search using the Brave Search API, ideal for general queries, news, articles, and online content. 
            // Use this for broad information gathering, recent events, or when you need diverse web sources. 
            // Supports pagination, content filtering, and freshness controls. 
            // Maximum 20 results per request, with offset for pagination. 
            const description = tool.description;
            //  {
            //   type: 'object',
            //   properties: {
            //     query: {
            //       type: 'string',
            //       description: 'Search query (max 400 chars, 50 words)'
            //     },
            //     count: {
            //       type: 'number',
            //       description: 'Number of results (1-20, default 10)',
            //       default: 10
            //     },
            //     offset: {
            //       type: 'number',
            //       description: 'Pagination offset (max 9, default 0)',
            //       default: 0
            //     }
            //   },
            //   required: [ 'query' ]
            // }
            const inputSchema = tool.inputSchema;
            
            // TODO: Fix game args:
            // this particular mcp argument is only expecting 1 argument, which is an object with threee properties, 
            // but we are passing 3 arguments here
            const game_args = Object.entries(inputSchema.properties || {}).map(([key, value]: [string, any]) => ({
                name: key,
                description: value.description || '',
                type: value.type || 'string'
            }));

            this.mcpFunctions.push(new GameFunction({
                name: name as string,
                description: description as string,
                args: game_args,
                // TODO: Implement the executable function
                executable: async (args: Record<string, any>, logger) => {
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Done,
                        "Done"
                    );
                }
            }));
        }
        
        return this.mcpFunctions;
    }

    public getWorker(data: {
        getEnvironment?: () => Promise<Record<string, any>>;
    }): GameWorker {
        return new GameWorker({
            id: this.id,
            name: this.name,
            description: this.description,
            functions: this.mcpFunctions,
            getEnvironment: data?.getEnvironment,
        });
    }

}

export default McpPlugin;