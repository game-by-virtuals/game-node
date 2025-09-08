import dotenv from "dotenv";
import { Address } from "viem";

dotenv.config({ path: __dirname + "/.env" });

function getEnvVar<T extends string = string>(key: string, required = true): T {
  const value = process.env[key];
  if (required && (value === undefined || value === "")) {
    throw new Error(`${key} is not defined or is empty in the .env file`);
  }
  return value as T;
}

export const WHITELISTED_WALLET_PRIVATE_KEY = getEnvVar<Address>(
  "WHITELISTED_WALLET_PRIVATE_KEY"
);

export const AGENT_WALLET_ADDRESS = getEnvVar<Address>(
  "AGENT_WALLET_ADDRESS"
);

export const SESSION_ENTITY_KEY_ID = parseInt(getEnvVar("SESSION_ENTITY_KEY_ID"));


const entities = {
  SESSION_ENTITY_KEY_ID,
  AGENT_WALLET_ADDRESS,
};

for (const [key, value] of Object.entries(entities)) {
  if (typeof value === "number" && isNaN(value)) throw new Error(`${key} must be a valid number`);
  if (typeof value === "string" && !value.startsWith("0x")) throw new Error(`${key} must be a valid address`);
}
