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

export const WHITELISTED_WALLET_PRIVATE_KEY = getEnvVar<Address>('WHITELISTED_WALLET_PRIVATE_KEY');
export const WHITELISTED_WALLET_ENTITY_ID = parseInt(getEnvVar('WHITELISTED_WALLET_ENTITY_ID'), 10);
export const ACP_AGENT_WALLET_ADDRESS_BUYER = getEnvVar('ACP_AGENT_WALLET_ADDRESS_BUYER') as Address;
export const ACP_AGENT_WALLET_ADDRESS_SELLER = getEnvVar<Address>('ACP_AGENT_WALLET_ADDRESS_SELLER') as Address;
export const GAME_DEV_API_KEY = getEnvVar('GAME_DEV_API_KEY');
export const GAME_API_KEY = getEnvVar('GAME_API_KEY');

if (isNaN(WHITELISTED_WALLET_ENTITY_ID)) {
    throw new Error('WHITELISTED_WALLET_ENTITY_ID must be a valid number in the .env file');
}
