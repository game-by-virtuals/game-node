import {
    GameWorker,
    GameFunction,
    ExecutableGameFunctionResponse,
    ExecutableGameFunctionStatus,
} from "@virtuals-protocol/game";
import axios from "axios";

interface IElfaAiPluginOptions {
    id?: string;
    name?: string;
    description?: string;
    credentials: {
        apiKey: string;
    };
}

class ElfaAiPlugin {
    private id: string;
    private name: string;
    private description: string;
    private base_url: string = "https://api.elfa.ai/v1";
    private apiKey: string;
    private header: Record<string, string>;

    constructor(options: IElfaAiPluginOptions) {
        this.id = options.id || "elfa_ai_worker";
        this.name = options.name || "Elfa AI Worker";
        this.description =
            options.description ||
            "A worker that executes tasks within the Elfa AI Platform. It is capable of retrieving crypto insights to discover alpha through methods such as top mentions, search mentions, trending tokens, and smart account stats.";
        this.apiKey = options.credentials.apiKey;
        this.header = { "x-elfa-api-key": this.apiKey };
    }

    public getWorker(data?: {
        functions?: GameFunction<any>[];
        getEnvironment?: () => Promise<Record<string, any>>;
    }): GameWorker {
        return new GameWorker({
            id: this.id,
            name: this.name,
            description: this.description,
            functions: data?.functions || [
                this.pingFunction,
                this.keyStatusFunction,
                this.mentionsFunction,
                this.topMentionsFunction,
                this.searchMentionsFunction,
                this.trendingTokensFunction,
                this.accountSmartStatsFunction,
            ],
            getEnvironment: data?.getEnvironment,
        });
    }

    /**
     * Ping function
     * GET /v1/ping
     */
    get pingFunction() {
        return new GameFunction({
            name: "ping",
            description: "Ping the Elfa AI API.",
            args: [],
            executable: async (args, logger) => {
                try {
                    const response = await axios.get(`${this.base_url}/ping`, {
                        headers: this.header,
                    });
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Done,
                        JSON.stringify(response.data)
                    );
                } catch (error: any) {
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        "Failed to ping the Elfa AI API."
                    );
                }
            },
        });
    }

    /**
     * Key Status function
     * GET /v1/key-status
     */
    get keyStatusFunction() {
        return new GameFunction({
            name: "key_status",
            description:
                "Retrieve the current status and usage of your API key.",
            args: [],
            executable: async (args, logger) => {
                try {
                    const response = await axios.get(
                        `${this.base_url}/key-status`,
                        {
                            headers: this.header,
                        }
                    );
                    logger("Key status retrieved successfully.");
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Done,
                        JSON.stringify(response.data)
                    );
                } catch (error: any) {
                    logger(`Error retrieving key status: ${error.message}`);
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        `Failed to get key status: ${error.message}`
                    );
                }
            },
        });
    }

    /**
     * Mentions function
     * GET /v1/mentions
     * Query parameters: limit (default 100), offset (default 0)
     */
    get mentionsFunction() {
        return new GameFunction({
            name: "get_mentions",
            description:
                "Retrieve tweets by smart accounts with with smart engagement.",
            args: [
                {
                    name: "limit",
                    description: "Number of results to return (default 100).",
                    type: "number",
                },
                {
                    name: "offset",
                    description: "Offset for pagination (default 0).",
                    type: "number",
                },
            ] as const,
            executable: async (args, logger) => {
                try {
                    const limit = Number(args.limit) || 100;
                    const offset = Number(args.offset) ?? 0;
                    const response = await axios.get(
                        `${this.base_url}/mentions`,
                        {
                            headers: this.header,
                            params: { limit, offset },
                        }
                    );
                    logger("Mentions retrieved successfully.");
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Done,
                        JSON.stringify(response.data)
                    );
                } catch (error: any) {
                    logger(`Error retrieving mentions: ${error.message}`);
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        `Failed to retrieve mentions: ${error.message}`
                    );
                }
            },
        });
    }

    /**
     * Top Mentions function
     * GET /v1/top-mentions
     * Query parameters: ticker (required), timeWindow (default "1h"), page (default 1), pageSize (default 10)
     */
    get topMentionsFunction() {
        return new GameFunction({
            name: "top_mentions",
            description:
                "Retrieve tweets that mention a specified ticker ranked by view count.",
            args: [
                {
                    name: "ticker",
                    description: "Ticker symbol to get mentions for.",
                    type: "string",
                },
                {
                    name: "timeWindow",
                    description: "Time window (e.g., '1h', '24h', '7d').",
                    type: "string",
                },
                {
                    name: "page",
                    description: "Page number for pagination (default 1).",
                    type: "number",
                },
                {
                    name: "pageSize",
                    description: "Number of items per page (default 10).",
                    type: "number",
                },
            ] as const,
            executable: async (args, logger) => {
                try {
                    const { ticker } = args;
                    const timeWindow = args.timeWindow || "1h";
                    const page = Number(args.page) ?? 1;
                    const pageSize = Number(args.pageSize) ?? 10;
                    if (!ticker) {
                        return new ExecutableGameFunctionResponse(
                            ExecutableGameFunctionStatus.Failed,
                            "Ticker is required."
                        );
                    }
                    const response = await axios.get(
                        `${this.base_url}/top-mentions`,
                        {
                            headers: this.header,
                            params: { ticker, timeWindow, page, pageSize },
                        }
                    );
                    logger("Top mentions retrieved successfully.");
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Done,
                        JSON.stringify(response.data)
                    );
                } catch (error: any) {
                    logger(`Error retrieving top mentions: ${error.message}`);
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        `Failed to retrieve top mentions: ${error.message}`
                    );
                }
            },
        });
    }

    /**
     * Search Mentions function
     * GET /v1/mentions/search
     * Query parameters: keywords (required, comma-separated), from (required), to (required), limit (default 20), cursor (optional)
     */
    get searchMentionsFunction() {
        return new GameFunction({
            name: "search_mentions",
            description:
                "Search and query tweets that mention keywords within a specified date range.",
            args: [
                {
                    name: "keywords",
                    description:
                        "Comma-separated keywords to search for. Phrases are accepted.",
                    type: "string",
                },
                {
                    name: "from",
                    description: "Start date (unix timestamp).",
                    type: "number",
                },
                {
                    name: "to",
                    description: "End date (unix timestamp).",
                    type: "number",
                },
                {
                    name: "limit",
                    description: "Number of results to return (default 20).",
                    type: "number",
                },
            ] as const,
            executable: async (args, logger) => {
                try {
                    const keywords = args.keywords;
                    const from = Number(args.from);
                    const to = Number(args.to);
                    const limit = Number(args.limit) ?? 20;
                    if (!keywords || !from || !to) {
                        return new ExecutableGameFunctionResponse(
                            ExecutableGameFunctionStatus.Failed,
                            "Keywords, from, and to are required."
                        );
                    }
                    const response = await axios.get(
                        `${this.base_url}/mentions/search`,
                        {
                            headers: this.header,
                            params: {
                                keywords,
                                from,
                                to,
                                limit,
                            },
                        }
                    );
                    logger("Search mentions retrieved successfully.");
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Done,
                        JSON.stringify(response.data)
                    );
                } catch (error: any) {
                    logger(`Error searching mentions: ${error.message}`);
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        `Failed to search mentions: ${error.message}`
                    );
                }
            },
        });
    }

    /**
     * Trending Tokens function
     * GET /v1/trending-tokens
     * Query parameters: timeWindow (default "24h"), page (default 1), pageSize (default 50), minMentions (default 5)
     */
    get trendingTokensFunction() {
        return new GameFunction({
            name: "trending_tokens",
            description:
                "Retrieve trending tokens based on mention counts and engagement.",
            args: [
                {
                    name: "timeWindow",
                    description:
                        "Time window for trending analysis (default '24h').",
                    type: "string",
                },
                {
                    name: "page",
                    description: "Page number (default 1).",
                    type: "number",
                },
                {
                    name: "pageSize",
                    description: "Number of items per page (default 50).",
                    type: "number",
                },
                {
                    name: "minMentions",
                    description:
                        "Minimum number of mentions required (default 5).",
                    type: "number",
                },
            ] as const,
            executable: async (args, logger) => {
                try {
                    const timeWindow = args.timeWindow || "24h";
                    const page = Number(args.page) ?? 1;
                    const pageSize = Number(args.pageSize) ?? 50;
                    const minMentions = Number(args.minMentions) ?? 5;
                    const response = await axios.get(
                        `${this.base_url}/trending-tokens`,
                        {
                            headers: this.header,
                            params: { timeWindow, page, pageSize, minMentions },
                        }
                    );
                    logger("Trending tokens retrieved successfully.");
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Done,
                        JSON.stringify(response.data)
                    );
                } catch (error: any) {
                    logger(
                        `Error retrieving trending tokens: ${error.message}`
                    );
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        `Failed to retrieve trending tokens: ${error.message}`
                    );
                }
            },
        });
    }

    /**
     * Account Smart Stats function
     * GET /v1/account/smart-stats
     * Query parameters: username (required)
     */
    get accountSmartStatsFunction() {
        return new GameFunction({
            name: "account_smart_stats",
            description:
                "Retrieve smart stats and social metrics for a given username.",
            args: [
                {
                    name: "username",
                    description: "Username to retrieve stats for.",
                    type: "string",
                },
            ] as const,
            executable: async (args, logger) => {
                try {
                    const username = args.username;
                    if (!username) {
                        return new ExecutableGameFunctionResponse(
                            ExecutableGameFunctionStatus.Failed,
                            "Username is required."
                        );
                    }
                    const response = await axios.get(
                        `${this.base_url}/account/smart-stats`,
                        {
                            headers: this.header,
                            params: { username },
                        }
                    );
                    logger("Account smart stats retrieved successfully.");
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Done,
                        JSON.stringify(response.data)
                    );
                } catch (error: any) {
                    logger(
                        `Error retrieving account smart stats: ${error.message}`
                    );
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        `Failed to retrieve account smart stats: ${error.message}`
                    );
                }
            },
        });
    }
}

export default ElfaAiPlugin;
