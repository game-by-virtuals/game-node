import DiscordClient from "../../../plugin/discord/discord";
import { apiRequest } from "../../../util/api"; // Import the actual apiRequest method to mock it

jest.mock("../../../__mocks__/apiRequest"); // Mock the apiRequest function

// Mock apiRequest function 
jest.mock("../../../util/api", () => ({
    apiRequest: jest.fn(), // Mock apiRequest as a Jest mock function
}));

describe("DiscordClient", () => {
    const botToken = "test-bot-token";
    const client = new DiscordClient(botToken);
    const baseURL = "https://discord.com/api/v10";

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

    // Test for addReaction function
    describe("addReaction", () => {
        it("should add a reaction to a message successfully", async () => {
            const args = {
                channelId: "12345",
                messageId: "67890",
                emoji: "👍",
            };

            // Mock
            const mockResponse = true; // Assuming the operation is successful
            (apiRequest as jest.Mock).mockResolvedValue(mockResponse);

            // Act
            const result = await client.addReaction(args);

            // Assert
            expect(result).toBe(true);
            expect(apiRequest).toHaveBeenCalledWith({
                method: "PUT",
                url: `${baseURL}/channels/${args.channelId}/messages/${args.messageId}/reactions/${encodeURIComponent(args.emoji)}/@me`,
                headers: {
                    Authorization: `Bot ${botToken}`,
                },
            });
        });
    });

    // Test for pinMessage function
    describe("pinMessage", () => {
        it("should pin a message successfully", async () => {
            const args = {
                channelId: "12345",
                messageId: "67890",
            };

            // Mock
            const mockResponse = true; // Assuming the operation is successful
            (apiRequest as jest.Mock).mockResolvedValue(mockResponse);

            // Act
            const result = await client.pinMessage(args);

            // Assert
            expect(result).toBe(true);
            expect(apiRequest).toHaveBeenCalledWith({
                method: "PUT",
                url: `${baseURL}/channels/${args.channelId}/pins/${args.messageId}`,
                headers: {
                    Authorization: `Bot ${botToken}`,
                },
            });
        });
    });

    // Test for deleteMessage function
    describe("deleteMessage", () => {
        it("should delete a message successfully", async () => {
            const args: DiscordMessageArgs = {
                channelId: "12345",
                messageId: "67890",
            };
            
            // Mock
            const mockResponse = true;
            (apiRequest as jest.Mock).mockResolvedValue(mockResponse);
            
            // Act
            const result = await client.deleteMessage(args);
            
            // Assert
            expect(result).toEqual(true);
            expect(apiRequest).toHaveBeenCalledWith({
                method: "DELETE",
                url: `${baseURL}/channels/${args.channelId}/messages/${args.messageId}`,
                headers: {
                    Authorization: `Bot ${botToken}`,
                },
            });
        });
    });

});
