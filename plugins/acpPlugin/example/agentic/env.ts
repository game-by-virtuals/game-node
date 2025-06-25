import dotenv from "dotenv";
import { Address } from "viem";

dotenv.config({ path: __dirname + '/.env' });

function getEnvVar<T extends string = string>(key: string, required = true): T {
    const value = process.env[key];
    if (required && (value === undefined || value === '')) {
        throw new Error(`${key} is not defined or is empty in the .env file`);
    }
    return value as T;
}

// ACP Agents' Credentials
export const WHITELISTED_WALLET_PRIVATE_KEY = getEnvVar<Address>('WHITELISTED_WALLET_PRIVATE_KEY');
export const WHITELISTED_WALLET_ENTITY_ID = parseInt(getEnvVar('WHITELISTED_WALLET_ENTITY_ID'), 10);
export const BUYER_AGENT_WALLET_ADDRESS = getEnvVar('BUYER_AGENT_WALLET_ADDRESS') as Address;
export const SELLER_AGENT_WALLET_ADDRESS = getEnvVar<Address>('SELLER_AGENT_WALLET_ADDRESS') as Address;

// GAME API Key
export const GAME_DEV_API_KEY = getEnvVar('GAME_DEV_API_KEY');
// GAME Dev API Key
export const GAME_API_KEY = getEnvVar('GAME_API_KEY');

// GAME Twitter Access Token for X (Twitter) Authentication
export const BUYER_AGENT_GAME_TWITTER_ACCESS_TOKEN = getEnvVar('BUYER_AGENT_GAME_TWITTER_ACCESS_TOKEN');
export const SELLER_AGENT_GAME_TWITTER_ACCESS_TOKEN = getEnvVar('SELLER_AGENT_GAME_TWITTER_ACCESS_TOKEN');

// Twitter API Credentials for X (Twitter) Authentication
// export const BUYER_AGENT_TWITTER_API_KEY = getEnvVar('BUYER_AGENT_TWITTER_API_KEY');
// export const BUYER_AGENT_TWITTER_API_SECRET_KEY = getEnvVar('BUYER_AGENT_TWITTER_API_SECRET_KEY');
// export const BUYER_AGENT_TWITTER_ACCESS_TOKEN = getEnvVar('BUYER_AGENT_TWITTER_ACCESS_TOKEN');
// export const BUYER_AGENT_TWITTER_ACCESS_TOKEN_SECRET = getEnvVar('BUYER_AGENT_TWITTER_ACCESS_TOKEN_SECRET');
export const SELLER_AGENT_TWITTER_API_KEY = getEnvVar('SELLER_AGENT_TWITTER_API_KEY');
export const SELLER_AGENT_TWITTER_API_SECRET_KEY = getEnvVar('SELLER_AGENT_TWITTER_API_SECRET_KEY');
export const SELLER_AGENT_TWITTER_ACCESS_TOKEN = getEnvVar('SELLER_AGENT_TWITTER_ACCESS_TOKEN');
export const SELLER_AGENT_TWITTER_ACCESS_TOKEN_SECRET = getEnvVar('SELLER_AGENT_TWITTER_ACCESS_TOKEN_SECRET');

if (isNaN(WHITELISTED_WALLET_ENTITY_ID)) {
    throw new Error('WHITELISTED_WALLET_ENTITY_ID must be a valid number in the .env file');
}
