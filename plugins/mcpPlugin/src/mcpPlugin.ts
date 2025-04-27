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
    // TODO: To see if other transport options other than StdioClientTransport
    // private mcpClientTransport: StdioClientTransport || ;
    private mcpFunctions: GameFunction<any>[];
    private mcpFunctionsInitializationPromise: Promise<void> | null = null;

    constructor(options: IMcpPluginOptions) {
        this.id = options.id;
        this.name = options.name;
        this.description = options.description;
        
        // Initialize the MCP client
        this.mcpClientConfiguration = options.mcpClientConfiguration;
        this.mcpClient = new McpClient(this.mcpClientConfiguration);
        this.mcpFunctions = [];
        this.mcpFunctionsInitializationPromise = this.initializeMcpFunctions();
    }

    private async initializeMcpFunctions() {
        try {
            this.mcpFunctions = await this.getMcpFunctions();
        } catch (e) {
            console.error('Failed to initialize MCP functions:', e);
            throw e; // Re-throw to handle in getWorker
        }
    }

    private async getMcpFunctions() {
        const toolsResult = await this.mcpClient.getTools();

        // TODO: Implement error handling
        for (const tool of toolsResult.tools) {

            // brave_web_search
            const toolName = tool.name;
            // Performs a web search using the Brave Search API, ideal for general queries, news, articles, and online content. 
            // Use this for broad information gathering, recent events, or when you need diverse web sources. 
            // Supports pagination, content filtering, and freshness controls. 
            // Maximum 20 results per request, with offset for pagination. 
            const toolDescription = tool.description;
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
            const toolInputSchema = tool.inputSchema;
            
            // TODO: Fix game args:
            // this particular mcp argument is only expecting 1 argument, which is an object with three properties,
            // but we are passing 3 arguments here
            const game_args = Object.entries(toolInputSchema.properties || {}).map(([key, value]: [string, any]) => ({
                name: key,
                description: value.description || '',
                type: value.type || 'string'
            }));

            this.mcpFunctions.push(new GameFunction({
                name: toolName as string,
                description: toolDescription as string,
                args: game_args,
                // TODO: Implement the executable function
                executable: async (args: Record<string, any>, logger) => {

                    const result = await this.mcpClient.callTool(
                        toolName,
                        args
                    );

                    console.log(result);
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Done,
                        `MCP server ${this.name}: ${toolName} executed successfully.`
                    );
                }
            }));
        }
        
        return this.mcpFunctions;
    }

    public async getWorker(data?: {
        getEnvironment?: () => Promise<Record<string, any>>;
    }): Promise<GameWorker> {
        // TODO: Clean up this Cursor slop
        // ensure initialization is complete
        if (this.mcpFunctionsInitializationPromise) {
            try {
                await this.mcpFunctionsInitializationPromise;
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new Error(`Failed to initialize MCP functions: ${errorMessage}`);
            }
        }

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