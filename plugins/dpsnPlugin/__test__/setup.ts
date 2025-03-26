// Jest setup file
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// Set default timeout for tests
jest.setTimeout(60000); // Increased to 60 seconds

// Global mocks and setup
global.console = {
  ...console,
  // You can customize console behavior for tests if needed
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};
