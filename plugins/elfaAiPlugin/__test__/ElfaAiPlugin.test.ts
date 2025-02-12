import ElfaAiPlugin from "../src/elfaAiPlugin";
import { ExecutableGameFunctionStatus } from "@virtuals-protocol/game";

describe("ElfaAiPlugin real API tests", () => {
    // Use a valid API key (not recommended for production)
    const realApiKey = "your_api_key";
    let elfaAiPlugin: ElfaAiPlugin;

    beforeAll(() => {
        elfaAiPlugin = new ElfaAiPlugin({
            credentials: { apiKey: realApiKey },
        });
    });

    describe("pingFunction", () => {
        it("should return Done status with valid ping response", async () => {
            const logger = jest.fn();
            // Provide an empty object as the argument
            const result = await elfaAiPlugin.pingFunction.executable(
                {},
                logger
            );
            expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
            expect(result.feedback).toHaveProperty("success", true);
            expect(result.feedback).toHaveProperty("data");
        });
    });

    describe("keyStatusFunction", () => {
        it("should return Done status with valid key status response", async () => {
            const logger = jest.fn();
            // Provide an empty object as the argument
            const result = await elfaAiPlugin.keyStatusFunction.executable(
                {},
                logger
            );
            expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
            expect(result.feedback).toHaveProperty("success");
            expect(result.feedback).toHaveProperty("data");
        });
    });

    describe("mentionsFunction", () => {
        it("should return Done status with valid mentions response", async () => {
            const logger = jest.fn();
            // Using default values: limit=100, offset=0
            const result = await elfaAiPlugin.mentionsFunction.executable(
                { limit: "100", offset: "0" },
                logger
            );
            expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
            expect(result.feedback).toHaveProperty("success");
            expect(result.feedback).toHaveProperty("data");
        });
    });

    describe("topMentionsFunction", () => {
        it("should return Done status when provided a valid ticker and parameters", async () => {
            const logger = jest.fn();
            // Provide a valid ticker symbol; adjust the value based on your API's expected data.
            const result = await elfaAiPlugin.topMentionsFunction.executable(
                {
                    ticker: "$SOL",
                    timeWindow: "1h",
                    page: "1",
                    pageSize: "10",
                },
                logger
            );
            expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
            expect(result.feedback).toHaveProperty("success");
            expect(result.feedback).toHaveProperty("data");
        });
    });

    describe("searchMentionsFunction", () => {
        it("should return Done status when provided valid keywords and date range", async () => {
            const logger = jest.fn();
            // Provide valid keywords and date range
            const now = Math.floor(Date.now() / 1000);
            const from = now - 86400 * 2; // 2 day ago
            const result = await elfaAiPlugin.searchMentionsFunction.executable(
                {
                    keywords: "ai, agent",
                    from: String(from),
                    to: String(now),
                    limit: "20",
                },
                logger
            );
            expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
            expect(result.feedback).toHaveProperty("success");
            expect(result.feedback).toHaveProperty("data");
        });
    });

    describe("trendingTokensFunction", () => {
        it("should return Done status with trending tokens response", async () => {
            const logger = jest.fn();
            // Using default values: timeWindow=24h, page=1, pageSize=50, minMentions=5
            const result = await elfaAiPlugin.trendingTokensFunction.executable(
                {
                    timeWindow: "24h",
                    page: "1",
                    pageSize: "50",
                    minMentions: "5",
                },
                logger
            );
            expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
            expect(result.feedback).toHaveProperty("success");
            expect(result.feedback).toHaveProperty("data");
        });
    });

    describe("accountSmartStatsFunction", () => {
        it("should return Done status when provided a valid username", async () => {
            const logger = jest.fn();
            // Provide a valid username
            const result =
                await elfaAiPlugin.accountSmartStatsFunction.executable(
                    {
                        username: "elonmusk",
                    },
                    logger
                );
            expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
            expect(result.feedback).toHaveProperty("success");
            expect(result.feedback).toHaveProperty("data");
        });
    });
});
