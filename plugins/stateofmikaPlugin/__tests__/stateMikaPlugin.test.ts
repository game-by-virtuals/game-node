import { describe, expect, test, jest } from '@jest/globals';
import {
    GameFunction,
    ExecutableGameFunctionResponse,
    ExecutableGameFunctionStatus
} from "@virtuals-protocol/game";
import StateMikaPlugin, { StateMikaArgs } from '../src/stateMikaPlugin';
import axios from 'axios';
import FormData from 'form-data';

// Mock axios but NOT FormData - we want to use the real FormData
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('StateMikaPlugin', () => {
    const apiKey = 'test_api_key';

    // Increase timeout for ALL tests in this suite
    jest.setTimeout(60000);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Clean up after each test
    afterEach(async () => {
        jest.clearAllTimers();
        await new Promise(resolve => setTimeout(resolve, 1000));
    });

    it('should create a plugin instance', () => {
        const plugin = new StateMikaPlugin({
            credentials: { apiKey }
        });
        expect(plugin).toBeInstanceOf(StateMikaPlugin);
    });

    it('should throw error if API key is missing', () => {
        expect(() => {
            new StateMikaPlugin({
                credentials: { apiKey: '' }
            });
        }).toThrow('API key is required');
    });

    it('should create a worker with custom function', () => {
        const plugin = new StateMikaPlugin({
            credentials: { apiKey }
        });

        const customArgs: StateMikaArgs = [
            {
                name: "query",
                type: "string",
                description: "The query to process"
            },
            {
                name: "instructions",
                type: "string",
                description: "Post-processing instructions",
                optional: true
            }
        ];

        const customFunction = new GameFunction<StateMikaArgs>({
            name: "custom",
            description: "Custom function",
            args: customArgs,
            executable: async (args: Partial<Record<"query" | "instructions", string>>, log: (message: string) => void) => {
                return new ExecutableGameFunctionResponse(
                    ExecutableGameFunctionStatus.Done,
                    'Custom response'
                );
            }
        });

        const worker = plugin.getWorker({
            functions: [customFunction]
        });

        expect(worker.functions).toHaveLength(1);
        expect(worker.functions[0].name).toBe('custom');
    });

    it('should handle API calls correctly', async () => {
        const plugin = new StateMikaPlugin({
            credentials: { apiKey }
        });

        mockedAxios.post.mockResolvedValueOnce({
            data: { result: 'Test response' }
        });

        const worker = plugin.getWorker();
        const result = await worker.functions[0].executable({
            query: 'Test query'
        }, console.log);

        expect(result.status).toBe('done');
        expect(JSON.parse(result.feedback)).toEqual({ result: 'Test response' });
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    test('should create a worker with default options', () => {
        const plugin = new StateMikaPlugin({
            credentials: { apiKey }
        });
        const worker = plugin.getWorker();
        expect(worker).toBeDefined();
        expect(worker.id).toBe('state_mika_worker');
        expect(worker.functions).toHaveLength(1);
    });

    test('should create a worker with custom options', () => {
        const customPlugin = new StateMikaPlugin({
            id: 'custom_id',
            name: 'Custom Name',
            description: 'Custom description',
            credentials: {
                apiKey
            }
        });
        const worker = customPlugin.getWorker();
        expect(worker.id).toBe('custom_id');
        expect(worker.name).toBe('Custom Name');
        expect(worker.description).toBe('Custom description');
    });

    test('should successfully execute a query', async () => {
        const mockResponse = {
            original_query: "SOL price today",
            route: {
                tool: "token_information",
                confidence: 0.9,
                parameters: {
                    query: "SOL",
                    chain_id: "solana"
                },
                description: "Test description"
            },
            response: {
                processed_response: "170.17",
                original_response: "schemaVersion='1.0.0' pairs=[...]"
            }
        };

        mockedAxios.post.mockResolvedValueOnce({
            data: mockResponse
        });

        const plugin = new StateMikaPlugin({
            credentials: { apiKey }
        });

        const worker = plugin.getWorker();
        const queryFn = worker.functions[0];
        const logger = jest.fn();

        const result = await queryFn.executable(
            { query: 'SOL price today' },
            logger
        );

        // Verify the API call
        const [url, formData, config] = mockedAxios.post.mock.calls[0];
        expect(url).toBe('https://state.gmika.io/api/v1/');
        expect(formData).toBeInstanceOf(FormData);
        expect(config).toEqual({
            headers: {
                'accept': 'application/json',
                'x-api-key': apiKey,
                'Content-Type': 'multipart/form-data'
            },
            timeout: 30000
        });

        expect(result.status).toBe('done');
        const response = JSON.parse(result.feedback);
        expect(response).toEqual(mockResponse);
    });

    test('should handle query errors', async () => {
        mockedAxios.post.mockRejectedValueOnce(new Error('API Error'));

        const plugin = new StateMikaPlugin({
            credentials: { apiKey }
        });

        const worker = plugin.getWorker();
        const queryFn = worker.functions[0];
        const logger = jest.fn();

        const result = await queryFn.executable(
            { query: 'test query' },
            logger
        );

        expect(result.status).toBe('failed');
        expect(result.feedback).toContain('Failed to process query');
        expect(logger).toHaveBeenCalled();
    });

    test('should handle pre-request setup errors', async () => {
        const plugin = new StateMikaPlugin({
            credentials: { apiKey }
        });

        const worker = plugin.getWorker();
        const queryFn = worker.functions[0];
        const logger = jest.fn();

        // Mock axios to throw an error before making the request
        mockedAxios.post.mockImplementationOnce(() => {
            throw new Error('Network configuration error');
        });

        const result = await queryFn.executable(
            { query: 'test query' },
            logger
        );

        // Verify error handling
        expect(result.status).toBe('failed');
        expect(result.feedback).toContain('Network configuration error');
        
        // Verify the specific log message was called
        expect(logger).toHaveBeenCalledWith(
            expect.stringContaining('Request setup error - Network configuration error')
        );
    });

    test('should fail if query is missing', async () => {
        const plugin = new StateMikaPlugin({
            credentials: { apiKey }
        });

        const worker = plugin.getWorker();
        const queryFn = worker.functions[0];
        const logger = jest.fn();

        const result = await queryFn.executable(
            { query: '' },
            logger
        );

        expect(result.status).toBe('failed');
        expect(result.feedback).toBe('Query is required');
    });

    test('should fail if query is undefined', async () => {
        const plugin = new StateMikaPlugin({
            credentials: { apiKey }
        });

        const worker = plugin.getWorker();
        const queryFn = worker.functions[0];
        const logger = jest.fn();

        const result = await queryFn.executable(
            {}, // Empty object = undefined query
            logger
        );

        expect(result.status).toBe('failed');
        expect(result.feedback).toBe('Query is required');
    });

    test('should create a worker with custom functions and environment', async () => {
        const customFunction = new GameFunction<StateMikaArgs>({
            name: "custom",
            description: "A custom function",
            args: [
                {
                    name: "query",
                    type: "string",
                    description: "The query to process"
                }
            ],
            executable: async () => new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Done,
                "Custom response"
            )
        });

        const customGetEnvironment = async () => ({ custom: "env" });

        const worker = new StateMikaPlugin({
            credentials: { apiKey }
        }).getWorker({
            functions: [customFunction],
            getEnvironment: customGetEnvironment
        });

        expect(worker).toBeDefined();
        expect(worker.functions).toHaveLength(1);
        expect(worker.functions[0].name).toBe('custom');
        expect(worker.getEnvironment).toBeDefined();
        
        const env = await worker.getEnvironment!();
        expect(env).toEqual({ custom: "env" });
    });

    test('should handle request errors with no response', async () => {
        // Mock axios to simulate a request that was made but got no response
        mockedAxios.post.mockImplementationOnce(() => {
            const error: any = new Error('No response received');
            error.request = {}; // This makes it match the "request exists but no response" case
            throw error;
        });

        const plugin = new StateMikaPlugin({
            credentials: { apiKey: 'test_key' }
        });

        const worker = plugin.getWorker();
        const queryFn = worker.functions[0];
        const logger = jest.fn();

        const result = await queryFn.executable(
            { query: 'test query' },
            logger
        );

        // Verify error handling
        expect(result.status).toBe('failed');
        expect(result.feedback).toContain('No response received');
        
        // Verify the specific log message was called
        expect(logger).toHaveBeenCalledWith(
            expect.stringContaining('No response received - No response received')
        );
    });

    test('should use default function when no custom functions provided', async () => {
        const plugin = new StateMikaPlugin({
            credentials: { apiKey }
        });

        // Call getWorker with empty options
        const worker = plugin.getWorker({});

        // Verify we get the default function
        expect(worker.functions).toHaveLength(1);
        expect(worker.functions[0].name).toBe('query');
        expect(worker.getEnvironment).toBeUndefined();
    });

    test('should work with no-op logger', async () => {
        const plugin = new StateMikaPlugin({
            credentials: { apiKey }
        });

        const worker = plugin.getWorker();
        const queryFn = worker.functions[0];

        // Mock axios to return an error so we can see the no-op logger in action
        mockedAxios.post.mockRejectedValueOnce(new Error('Test error'));

        // Call with no-op logger
        const result = await queryFn.executable(
            { query: 'test query' },
            () => {} // no-op function that satisfies (msg: string) => void
        );

        expect(result.status).toBe('failed');
        expect(result.feedback).toContain('Failed to process query');
    });

    test('should handle 500 server error', async () => {
        const plugin = new StateMikaPlugin({
            credentials: { apiKey }
        });

        const worker = plugin.getWorker();
        const queryFn = worker.functions[0];
        const logger = jest.fn();

        // Mock axios to return a 500 error
        mockedAxios.post.mockRejectedValueOnce({
            response: {
                status: 500,
                data: {
                    detail: 'Internal server error'
                }
            }
        });

        const result = await queryFn.executable(
            { query: 'test query' },
            logger
        );

        expect(result.status).toBe('failed');
        expect(result.feedback).toBe('Server Error: Internal server error (500)');
    });
}); 