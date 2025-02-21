import StateMikaPlugin from '../src/stateMikaPlugin';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const apiKey = process.env.STATE_OF_MIKA_API_KEY;
if (!apiKey) {
    console.error('STATE_OF_MIKA_API_KEY environment variable is required');
    process.exit(1);
}

describe('StateMikaPlugin Integration Tests', () => {
    let plugin: StateMikaPlugin;
    
    // Increase timeout even more for ALL tests in this suite
    jest.setTimeout(120000);  // 2 minutes

    beforeEach(() => {
        plugin = new StateMikaPlugin({
            credentials: {
                apiKey: apiKey
            }
        });
    });

    // Clean up after each test with longer delay
    afterEach(async () => {
        jest.clearAllTimers();
        // Wait longer between tests to ensure connections are closed
        await new Promise(resolve => setTimeout(resolve, 2000));
    });

    test('should fetch SOL price data', async () => {
        const worker = plugin.getWorker();
        const queryFn = worker.functions[0];
        
        console.log('Starting SOL price query...');
        
        try {
            const result = await queryFn.executable({
                query: 'SOL price today'
            }, (msg) => console.log('Logger:', msg));

            // Log the raw result first
            console.log('Raw result status:', result.status);
            console.log('Raw result feedback:', result.feedback);

            if (result.status === 'failed') {
                console.error('Query failed:', result.feedback);
                throw new Error(result.feedback);
            }

            // Try parsing the response and log any parsing errors
            let response;
            try {
                response = JSON.parse(result.feedback);
                console.log('Successfully parsed response:', JSON.stringify(response, null, 2));
            } catch (parseError) {
                console.error('Failed to parse response:', {
                    parseError,
                    rawFeedback: result.feedback
                });
                throw parseError;
            }
            
            // More specific response validation
            expect(response).toMatchObject({
                original_query: expect.any(String),
                route: {
                    tool: expect.any(String),
                    confidence: expect.any(Number),
                    parameters: expect.objectContaining({
                        query: expect.any(String),
                        chain_id: expect.any(String)
                    }),
                    description: expect.any(String)
                },
                response: expect.objectContaining({
                    processed_response: expect.any(String),
                    original_response: expect.any(String)
                })
            });

            // Additional validation for non-empty values
            expect(response.original_query).toBeTruthy();
            expect(response.route.tool).toBeTruthy();
            expect(response.route.parameters.query).toBeTruthy();
            expect(response.response.processed_response).toBeTruthy();

            console.log('Parsed Response:', {
                originalQuery: response.original_query,
                tool: response.route.tool,
                confidence: response.route.confidence,
                parameters: response.route.parameters,
                processedResponse: response.response.processed_response
            });

        } catch (err) {
            console.error('Raw error:', err);
            const error = err as Error;
            const errorObj: any = err;
            
            // More detailed error logging
            console.error('API Call Error:', {
                name: error?.name || 'Unknown Error',
                message: error?.message || 'No error message',
                stack: error?.stack || 'No stack trace',
                responseData: errorObj?.response?.data,
                responseStatus: errorObj?.response?.status,
                code: errorObj?.code,
                config: errorObj?.config,
                isAxiosError: errorObj?.isAxiosError,
                socketError: errorObj?.code === 'ECONNRESET' ? 'Socket hang up detected' : undefined
            });

            // Rethrow with more context
            throw new Error(`API test failed: ${error.message}`);
        }
    });

    test('should handle invalid queries', async () => {
        const worker = plugin.getWorker();
        const queryFn = worker.functions[0];
        
        const result = await queryFn.executable({
            query: ''
        }, console.log);

        expect(result.status).toBe('failed');
        expect(result.feedback).toBe('Query is required');
    });

    test('should handle API errors gracefully', async () => {
        const worker = plugin.getWorker();
        const queryFn = worker.functions[0];
        
        // Test with invalid API key - should get 401
        const invalidPlugin = new StateMikaPlugin({
            credentials: {
                apiKey: 'invalid_key'
            }
        });
        const invalidWorker = invalidPlugin.getWorker();
        
        const result = await invalidWorker.functions[0].executable({
            query: 'test query'
        }, (msg) => console.log('Error Test Logger:', msg));

        // Verify error handling
        expect(result.status).toBe('failed');
        expect(result.feedback).toContain('401');
        expect(result.feedback).toContain('Authentication failed');
        expect(result.feedback).toContain('Invalid API key');

        // Test with empty query - should fail validation
        const emptyResult = await queryFn.executable({
            query: ''
        }, (msg) => console.log('Empty Query Test Logger:', msg));

        expect(emptyResult.status).toBe('failed');
        expect(emptyResult.feedback).toBe('Query is required');

        // Test with malformed query - should fail gracefully
        const malformedResult = await queryFn.executable({
            query: '!@#$%^'
        }, (msg) => console.log('Malformed Query Test Logger:', msg));

        expect(malformedResult.status).toBe('failed');
        
        // Check for either a 400 or 500 error with their specific messages
        const is400Error = malformedResult.feedback.includes('Bad Request') && 
                          malformedResult.feedback.includes('400');
        const is500Error = malformedResult.feedback.includes('Server Error') && 
                          malformedResult.feedback.includes('500');
        
        expect(is400Error || is500Error).toBe(true);
        
        // Verify we get the appropriate error detail
        if (is400Error) {
            expect(malformedResult.feedback).toMatch(/Bad Request: .* \(400\)/);
        } else {
            expect(malformedResult.feedback).toMatch(/Server Error: .* \(500\)/);
        }
    });
}); 