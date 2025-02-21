import {
    GameFunction,
    GameWorker,
    ExecutableGameFunctionResponse,
    ExecutableGameFunctionStatus
} from "@virtuals-protocol/game";
import axios, { AxiosError } from 'axios';
import FormData from 'form-data';

export type StateMikaArgs = {
    name: string;
    type: string;
    description: string;
    optional?: boolean;
}[];

export interface StateMikaResponse {
    original_query: string;
    route: {
        tool: string;
        confidence: number;
        parameters: {
            query?: string;
            chain_id?: string;
            [key: string]: unknown;
        };
        description: string;
    };
    response: {
        processed_response: string;
        original_response: string;
    };
}

interface StateMikaErrorResponse {
    detail?: string;
    [key: string]: unknown;
}

export default class StateMikaPlugin {
    private readonly apiKey: string;
    private readonly baseUrl: string = 'https://state.gmika.io/api/v1/';
    private readonly id: string;
    private readonly name: string;
    private readonly description: string;

    constructor(options: {
        credentials: { apiKey: string };
        id?: string;
        name?: string;
        description?: string;
    }) {
        const { credentials, id, name, description } = options;

        if (!credentials.apiKey) {
            throw new Error('API key is required');
        }

        this.apiKey = credentials.apiKey;
        this.id = id || 'state_mika_worker';
        this.name = name || 'State Mika Worker';
        this.description = description || 'A worker that processes queries using the State Mika API';
    }

    private async queryFunction(query: string, log?: (message: string) => void): Promise<ExecutableGameFunctionResponse> {
        const formData = new FormData();
        formData.append('query', query);
        formData.append('tool', '');
        formData.append('parameters_str', '');
        formData.append('file', '');

        if (log) {
            log(`Making request to ${this.baseUrl} with query: ${query}`);
        }

        const maxRetries = 3;
        let firstMeaningfulError: Error | null = null;
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await axios.post<StateMikaResponse>(
                    this.baseUrl,
                    formData,
                    {
                        headers: {
                            'accept': 'application/json',
                            'x-api-key': this.apiKey,
                            'Content-Type': 'multipart/form-data'
                        },
                        timeout: 30000
                    }
                );

                return new ExecutableGameFunctionResponse(
                    ExecutableGameFunctionStatus.Done,
                    JSON.stringify(response.data)
                );
            } catch (error) {
                const axiosError = error as AxiosError;
                lastError = error as Error;
                
                // Store the first error, whether it's a response error or setup error
                if (!firstMeaningfulError) {
                    firstMeaningfulError = error as Error;
                }

                // Log specific error details
                if (log) {
                    if (axiosError.response) {
                        log(`Attempt ${attempt} failed: Server responded with status ${axiosError.response.status}`);
                        log(`Error details: ${JSON.stringify(axiosError.response.data)}`);
                    } else if (axiosError.request) {
                        log(`Attempt ${attempt} failed: No response received - ${axiosError.message}`);
                    } else {
                        // This is a pre-request error
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        log(`Attempt ${attempt} failed: Request setup error - ${errorMessage}`);
                    }
                }

                // Handle specific error cases
                if (axiosError.response?.status === 401) {
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        `Authentication failed: Invalid API key (401 Unauthorized)`
                    );
                }

                if (axiosError.response?.status === 400) {
                    const errorData = axiosError.response.data as StateMikaErrorResponse;
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        `Bad Request: ${errorData.detail || 'Invalid query'} (400)`
                    );
                }

                if (axiosError.response?.status === 500) {
                    const errorData = axiosError.response.data as StateMikaErrorResponse;
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        `Server Error: ${errorData.detail || 'Failed to process query'} (500)`
                    );
                }
                
                if (attempt < maxRetries) {
                    // Exponential backoff
                    const delay = Math.pow(2, attempt) * 1000;
                    if (log) log(`Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        // Use the first error we encountered
        const errorToUse = firstMeaningfulError || lastError;
        const errorMessage = errorToUse?.message || 'Unknown error';

        return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Failed to process query: ${errorMessage}`
        );
    }

    getWorker(options?: {
        functions?: GameFunction<StateMikaArgs>[];
        getEnvironment?: () => Promise<Record<string, unknown>>;
    }): GameWorker {
        const defaultFunction = new GameFunction<StateMikaArgs>({
            name: "query",
            description: "Process a query using the State Mika API",
            args: [
                {
                    name: "query",
                    type: "string",
                    description: "The query to process"
                }
            ],
            executable: async (args: Partial<Record<"query", string>>, logger: (msg: string) => void) => {
                if (!args.query) {
                    return new ExecutableGameFunctionResponse(
                        ExecutableGameFunctionStatus.Failed,
                        'Query is required'
                    );
                }

                return this.queryFunction(args.query, logger);
            }
        });

        return new GameWorker({
            id: this.id,
            name: this.name,
            description: this.description,
            functions: options?.functions || [defaultFunction],
            getEnvironment: options?.getEnvironment
        });
    }
}
