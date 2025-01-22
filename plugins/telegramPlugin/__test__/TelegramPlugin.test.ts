import TelegramPlugin from '../src/telegramPlugin';
import TelegramBot from "node-telegram-bot-api";
import { ExecutableGameFunctionStatus, ExecutableGameFunctionResponse } from "@virtuals-protocol/game";

// Mock the TelegramBot constructor and its methods
jest.mock('node-telegram-bot-api', () => {
  return jest.fn().mockImplementation(() => {
    return {
      sendMessage: jest.fn(),  // Mock the sendMessage method
      sendPhoto: jest.fn(),  // Mock the sendPhoto method
      sendDocument: jest.fn(),  // Mock the sendDocument method
      sendVideo: jest.fn(),  // Mock the sendVideo method
      sendAudio: jest.fn(),  // Mock the sendAudio method
      sendPoll: jest.fn(),  // Mock the sendPoll method
      pinChatMessage: jest.fn(),  // Mock the pinChatMessage method
      unPinChatMessage: jest.fn(),  // Mock the unPinChatMessage method
      deleteMessage: jest.fn(),  // Mock the deleteMessage method
    };
  });
});


describe("TelegramPlugin sendMessageFunction", () => {

  it("should send a message successfully when valid arguments are passed", async () => {
    // Arrange
    const telegramPlugin = new TelegramPlugin({
      credentials: {
        botToken: "mock_bot_token",
      },
    });

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
    const telegramPlugin = new TelegramPlugin({
      credentials: {
        botToken: "mock_bot_token",
      },
    });

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
    const telegramPlugin = new TelegramPlugin({
      credentials: {
        botToken: "mock_bot_token",
      },
    });

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

});

describe("TelegramPlugin createPollFunction", () => {

  it("should create an interactive poll successfully when valid arguments are passed", async () => {
    // Arrange
    const telegramPlugin = new TelegramPlugin({
      credentials: {
        botToken: "mock_bot_token",
      },
    });

    const colors: string[] = ["Red", "Green", "Blue", "Yellow"];

    const taskArgs = {
      chat_id: "811200161",
      question: "What is your favorite color?",
      options: colors,
    };
    const logger = jest.fn();

    // Act
    const result = await telegramPlugin.createPollFunction.executable(taskArgs, logger);

    // Assert
    // expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
    expect(logger).toHaveBeenNthCalledWith(1, "Creating poll in chat: 811200161");
    expect(logger).toHaveBeenNthCalledWith(2, "Creating poll in chat: 811200161");
  });

});

describe("TelegramPlugin pinnedMessageFunction", () => {

  it("should pin an important message in a chat successfully when valid arguments are passed", async () => {
    // Arrange
    const telegramPlugin = new TelegramPlugin({
      credentials: {
        botToken: "mock_bot_token",
      },
    });

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

});
