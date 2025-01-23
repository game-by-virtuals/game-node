import DiscordPlugin from '../src/discordPlugin';
import { Client } from 'discord.js';
import { ExecutableGameFunctionStatus } from "@virtuals-protocol/game";

// Mock discord.js
jest.mock('discord.js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    login: jest.fn().mockImplementation(() => ({
      then: jest.fn((successCallback) => {
        successCallback();
        return {
          catch: jest.fn()
        };
      }),
      catch: jest.fn()
    })),
    on: jest.fn().mockImplementation(() => {}),
    once: jest.fn().mockImplementation(() => {}),
    // Mock the channels property
    channels: {
      fetch: jest.fn().mockResolvedValue({
        isTextBased: jest.fn().mockReturnValue(true),
        send: jest.fn().mockResolvedValue({}),
        // Mock the messages property
        messages: {
          fetch: jest.fn().mockResolvedValue({
            react: jest.fn(),
            pin: jest.fn(),
            delete: jest.fn(),
            send: jest.fn()
          })
        }
      })
    }
  })),
  GatewayIntentBits: {
    Guilds: 'Guilds',
    GuildMessages: 'GuildMessages',
    MessageContent: 'MessageContent',
    GuildMessageReactions: 'GuildMessageReactions',
    DirectMessages: 'DirectMessages',
    DirectMessageReactions: 'DirectMessageReactions',
    DirectMessageTyping: 'DirectMessageTyping'
  }
}));

describe('DiscordPlugin', () => {
  const discordPlugin = new DiscordPlugin({
    credentials: { botToken: 'mock-token' }
  });

  describe('Constructor', () => {
    it('should initialize with default values', () => {
      expect(discordPlugin['id']).toBe('discord_worker');
      expect(discordPlugin['name']).toBe('Discord Worker');
      expect(discordPlugin['description']).toBeDefined();
    });

    it('should create a Discord client with correct intents', () => {
      expect(Client).toHaveBeenCalledWith(expect.objectContaining({
        intents: expect.any(Array)
      }));
    });
  });

  describe('getWorker', () => {
    it('should return a GameWorker with default functions', () => {
      const worker = discordPlugin.getWorker();

      expect(worker).toBeDefined();
      expect(worker.functions).toHaveLength(4);
      expect(worker.functions.map(f => f.name)).toEqual([
        'send_message',
        'add_reaction',
        'pin_message',
        'delete_message'
      ]);
    });
  });

  describe('Game Functions', () => {

    describe('sendMessageFunction', () => {
      it('should send message successfully when valid arguments passed in', async () => {
        const logger = jest.fn();
        const result = await discordPlugin.sendMessageFunction.executable(
          { channel_id: '123', content: 'Send this message' },
          logger
        );

        expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
        expect(result.feedback).toContain('Message sent successfully.');
      });

      it('should fail if channel_id or content is missing', async () => {
        const result = await discordPlugin.sendMessageFunction.executable(
          { channel_id: '', content: '' },
          jest.fn()
        );

        expect(result.status).toBe(ExecutableGameFunctionStatus.Failed);
        expect(result.feedback).toContain('Both channel_id and content are required');
      });
    });

    describe('addReactionFunction', () => {
      it('should add reaction successfully when required argument is passed', async () => {
        const result = await discordPlugin.addReactionFunction.executable(
          { channel_id: '123', message_id: '321', emoji: '😊' },
          jest.fn()
        );

        expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
        expect(result.feedback).toContain('Reaction added successfully.');
      });

      it('should fail if any required argument is missing', async () => {
        const result = await discordPlugin.addReactionFunction.executable(
          { channel_id: '', message_id: '', emoji: '' },
          jest.fn()
        );

        expect(result.status).toBe(ExecutableGameFunctionStatus.Failed);
        expect(result.feedback).toContain('channel_id, message_id, and emoji are required');
      });
    });

    describe('pinMessageFunction', () => {
      it('should success pin message if required arguments is passed', async () => {
        const result = await discordPlugin.pinMessageFunction.executable(
          { channel_id: '123', message_id: '321' },
          jest.fn()
        );

        expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
        expect(result.feedback).toContain('Message pinned successfully.');
      });

      it('should fail if channel_id or message_id is missing', async () => {
        const result = await discordPlugin.pinMessageFunction.executable(
          { channel_id: '', message_id: '' },
          jest.fn()
        );

        expect(result.status).toBe(ExecutableGameFunctionStatus.Failed);
        expect(result.feedback).toContain('Both channel_id and message_id are required');
      });
    });

    describe('deleteMessageFunction', () => {
      it('should delete message successfully', async () => {
        const result = await discordPlugin.deleteMessageFunction.executable(
          { channel_id: '123', message_id: '321' },
          jest.fn()
        );

        expect(result.status).toBe(ExecutableGameFunctionStatus.Done);
        expect(result.feedback).toContain('Message deleted successfully.');
      });

      it('should fail if channel_id or message_id is missing', async () => {
        const result = await discordPlugin.deleteMessageFunction.executable(
          { channel_id: '', message_id: '' },
          jest.fn()
        );

        expect(result.status).toBe(ExecutableGameFunctionStatus.Failed);
        expect(result.feedback).toContain('Both channel_id and message_id are required');
      });
    });

  });
});