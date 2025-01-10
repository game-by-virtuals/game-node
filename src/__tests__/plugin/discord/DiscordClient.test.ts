import DiscordClient from "../../../plugin/discord/discord";

jest.mock("../../../__mocks__/apiRequest"); // Mock the apiRequest function

describe("DiscordClient", () => {
    const botToken = "test-bot-token";
    const client = new DiscordClient(botToken);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("sendMessage", () => {
        it("should send a message successfully", async () => {
            const args: DiscordSendMessageArgs = {
                channelId: "12345",
                content: "Hello, Discord!",
                tts: false,
                embed: undefined
            };

            const mockResponse = { id: "67890", content: args.content };

            jest.spyOn(client, "sendMessage").mockResolvedValue(mockResponse);

            const result = await client.sendMessage(args);
            expect(result).toEqual(mockResponse);
        });

    });
});
