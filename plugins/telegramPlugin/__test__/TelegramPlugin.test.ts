import TelegramPlugin from '../src/telegramPlugin';
import { ExecutableGameFunctionStatus } from "@virtuals-protocol/game";

// Mock the TelegramBot constructor and its methods
jest.mock('node-telegram-bot-api', () => {
  return jest.fn().mockImplementation(() => {
    return {
      sendMessage: jest.fn(),  // Mock the sendMessage method
      sendPhoto: jest.fn(),  // Mock the sendPhoto method
      sendDocument: jest.fn(),  // Mock the sendDocument method
      sendVideo: jest.fn(),  // Mock the sendVideo method
      sendAudio: jest.fn(),  // Mock the sendAudio method
      sendPoll: jest.fn().mockResolvedValue({  // Mock the sendPoll method
        poll: {
          id: "12345",
          question: "What is your favorite color?",
          options: [
            { text: "Red", voter_count: 0 },
            { text: "Green", voter_count: 0 },
            { text: "Blue", voter_count: 0 },
          ],
          total_voter_count: 0,
          is_closed: false,
          is_anonymous: true,
        },
      }),
      pinChatMessage: jest.fn(),  // Mock the pinChatMessage method
      unpinChatMessage: jest.fn(),  // Mock the unPinChatMessage method
      deleteMessage: jest.fn(),  // Mock the deleteMessage method
    };
  });
});

const telegramPlugin = new TelegramPlugin({
  credentials: {
    botToken: "mock_bot_token",
  },
});

beforeEach(() => {
  jest.clearAllMocks();
});


describe("TelegramPlugin sendMessageFunction", () => {

  it("should send a message successfully when valid arguments are passed", async () => {
    // Arrange
    const taskArgs = { chat_id: "811200161", text: "hi, bot what your name" };
    const logger = jest.fn();

    // Act
    const result = await telegramPlugin.sendMessageFunction.executable(taskArgs, logger);

    // Assert
    expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
    expect(logger).toHaveBeenCalledWith("Sending message to channel: hi, bot what your name");
    expect(logger).toHaveBeenCalledWith("Message sent successfully.");

  });

  it("should send a message failed when missing arguments are passed", async () => {
    // Arrange
    const taskArgs = { chat_id: "811200161" };
    const logger = jest.fn();

    // Act
    const result = await telegramPlugin.sendMessageFunction.executable(taskArgs, logger);

    // Assert
    expect(result.status).toBe(ExecutableGameFunctionStatus.Failed);
  });
});

describe("TelegramPlugin sendMediaFunction", () => {

  it("should send a photo successfully when valid arguments are passed", async () => {
    // Arrange
    const taskArgs = {
      chat_id: "811200161",
      media_type: "photo",
      media: "https://example.com/image.jpg",
      caption: "This is a photo"
    };
    const logger = jest.fn();

    // Act
    const result = await telegramPlugin.sendMediaFunction.executable(taskArgs, logger);

    // Assert
    expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
    expect(logger).toHaveBeenNthCalledWith(1, "Sending photo media to chat: 811200161");

  });

  it("should send a document successfully when valid arguments are passed", async () => {
    // Arrange
    const taskArgs = {
      chat_id: "811200161",
      media_type: "document",
      media: "https://example.com/image.pdf",
      caption: "This is a document"
    };
    const logger = jest.fn();

    // Act
    const result = await telegramPlugin.sendMediaFunction.executable(taskArgs, logger);

    // Assert
    expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
    expect(logger).toHaveBeenNthCalledWith(1, "Sending document media to chat: 811200161");

  });

  it("should send a video successfully when valid arguments are passed", async () => {
    // Arrange
    const taskArgs = {
      chat_id: "811200161",
      media_type: "video",
      media: "https://example.com/video.mp4",
      caption: "This is a video"
    };
    const logger = jest.fn();

    // Act
    const result = await telegramPlugin.sendMediaFunction.executable(taskArgs, logger);

    // Assert
    expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
    expect(logger).toHaveBeenNthCalledWith(1, "Sending video media to chat: 811200161");

  });

  it("should send a audio successfully when valid arguments are passed", async () => {
    // Arrange
    const taskArgs = {
      chat_id: "811200161",
      media_type: "audio",
      media: "https://example/com/audio.mp4",
      caption: "This is a audio"
    };
    const logger = jest.fn();

    // Act
    const result = await telegramPlugin.sendMediaFunction.executable(taskArgs, logger);

    // Assert
    expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
    expect(logger).toHaveBeenNthCalledWith(1, "Sending audio media to chat: 811200161");

  });

  it("should send a photo failed when missing arguments are passed", async () => {
    // Arrange
    const taskArgs = {
      chat_id: "811200161",
      media: "https://example.com/image.jpg",
      caption: "This is a photo"
    };
    const logger = jest.fn();

    // Act
    const result = await telegramPlugin.sendMediaFunction.executable(taskArgs, logger);

    // Assert
    expect(result.status).toBe(ExecutableGameFunctionStatus.Failed);
  });

});

describe("TelegramPlugin createPollFunction", () => {

  it("should create an interactive poll successfully when valid arguments are passed", async () => {
    // Arrange
    const colors: string[] = ["Red", "Green", "Blue", "Yellow"];

    const taskArgs = {
      chat_id: "811200161",
      question: "What is your favorite color?",
      options: colors.toString(),
    };
    const logger = jest.fn();

    // Act
    const result = await telegramPlugin.createPollFunction.executable(taskArgs, logger);

    // Assert
    expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
    expect(logger).toHaveBeenNthCalledWith(1, "Creating poll in chat: 811200161");
    expect(logger).toHaveBeenNthCalledWith(2, "Poll created successfully. Poll ID: 12345");
  });

  it("should failed to create an interactive poll when missing arguments are passed", async () => {
    // Arrange
    const taskArgs = {
      chat_id: "811200161",
      question: "What is your favorite color?",
    };
    const logger = jest.fn();

    // Act
    const result = await telegramPlugin.createPollFunction.executable(taskArgs, logger);

    // Assert
    expect(result.status).toBe(ExecutableGameFunctionStatus.Failed);
  });

});

describe("TelegramPlugin pinnedMessageFunction", () => {

  it("should pin an important message in a chat successfully when valid arguments are passed", async () => {
    // Arrange
    const taskArgs = {
      chat_id: "811200161",
      message_id: "123456789"
    };
    const logger = jest.fn();

    // Act
    const result = await telegramPlugin.pinnedMessageFunction.executable(taskArgs, logger);

    // Assert
    expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
    expect(logger).toHaveBeenNthCalledWith(1, "Pinning message with ID: 123456789 in chat: 811200161");
    expect(logger).toHaveBeenNthCalledWith(2, "Message pinned successfully.");
  });

  it("should failed to pin an important message in a chat when missing arguments are passed", async () => {
    // Arrange
    const taskArgs = {
      chat_id: "811200161",
    };
    const logger = jest.fn();

    // Act
    const result = await telegramPlugin.pinnedMessageFunction.executable(taskArgs, logger);

    // Assert
    expect(result.status).toBe(ExecutableGameFunctionStatus.Failed);
  });

});

describe("TelegramPlugin unPinnedMessageFunction", () => {

  it("should unpin an important message in a chat successfully when valid arguments are passed", async () => {
    // Arrange
    const taskArgs = {
      chat_id: "811200161",
      message_id: "123456789"
    };
    const logger = jest.fn();

    // Act
    const result = await telegramPlugin.unPinnedMessageFunction.executable(taskArgs, logger);

    // Assert
    expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
    expect(logger).toHaveBeenNthCalledWith(1, "Unpinning message with ID: 123456789 in chat: 811200161");
    expect(logger).toHaveBeenNthCalledWith(2, "Message unpinned successfully.");
  });

  it("should failed to unpin an important message in a chat when missing arguments are passed", async () => {
    // Arrange
    const taskArgs = {
      chat_id: "811200161",
    };
    const logger = jest.fn();

    // Act
    const result = await telegramPlugin.unPinnedMessageFunction.executable(taskArgs, logger);

    // Assert
    expect(result.status).toBe(ExecutableGameFunctionStatus.Failed);
  });

});

describe("TelegramPlugin deleteMessageFunction", () => {

  it("should delete message from a chat successfully when valid arguments are passed", async () => {
    // Arrange
    const taskArgs = {
      chat_id: "811200161",
      message_id: "123456789"
    };
    const logger = jest.fn();

    // Act
    const result = await telegramPlugin.deleteMessageFunction.executable(taskArgs, logger);

    // Assert
    expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
    expect(logger).toHaveBeenNthCalledWith(1, "Deleting messages from chat: 811200161. Message IDs: 123456789");
    expect(logger).toHaveBeenNthCalledWith(2, "Messages deleted successfully.");
  });

  it("should failed to delete message from a chat when missing arguments are passed", async () => {
    // Arrange
    const taskArgs = {
      chat_id: "811200161",
    };
    const logger = jest.fn();

    // Act
    const result = await telegramPlugin.deleteMessageFunction.executable(taskArgs, logger);

    // Assert
    expect(result.status).toBe(ExecutableGameFunctionStatus.Failed);
  });

});
