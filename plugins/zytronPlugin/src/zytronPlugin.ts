import { ExecutableGameFunctionResponse, ExecutableGameFunctionStatus, GameFunction, GameWorker } from "@virtuals-protocol/game";
import { isAddress } from "viem/utils";
import ZytronWallet from "./zytronWallet";
import { SupportedToken, zytron } from "./constants";
import { isValidNumber } from "./utils";
import { Address, parseUnits } from "viem";

interface IZytronPluginOptions {
  id?: string;
  name?: string;
  description?: string;
  wallet: ZytronWallet;
}

class ZytronPlugin {
  private id: string;
  private name: string;
  private description: string;
  private wallet: ZytronWallet;

  constructor(options: IZytronPluginOptions) {
    this.id = options.id || "zytron_worker";
    this.name = options.name || "Zytron Worker";
    this.description = options.description || "This Worker enables users to execute interactions on the Zytron mainnet.";
    this.wallet = options.wallet;
  }

  public getWorker(functions?: GameFunction<any>[]): GameWorker {
    return new GameWorker({
        id: this.id,
        name: this.name,
        description: this.description,
        functions: functions || [this.checkWalletFunction, this.sendTokenFunction],
        getEnvironment: async () => ({
          network: zytron
        }),
    });
  }

  get checkWalletFunction() {
    return new GameFunction({
      name: "check_wallet",
      description: "Check a wallet balance on Zytron Mainnet.",
      args: [
        {
          name: "walletAddress",
          type: "string",
          description:
            "Wallet address to check. Make sure that the wallet address is in the correct format. Use 'my wallet' or 'wallet' for the default address",
        },
      ] as const,
      executable: async (args, logger) => {
        try {
          const { walletAddress } = args;
          if (!walletAddress) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Wallet address is required."
            );
          }
          const address = ['my wallet', 'wallet'].includes(walletAddress.toLowerCase()) ? this.wallet.getAddress() : walletAddress;
          if (!isAddress(address)) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Invalid address format."
            );
          }

          logger(`Checking wallet balance: ${address}`);

          const balance = await this.wallet.getBalance(address);
          // Get the channel using the Discord.js client
          logger(`Wallet balance: ${balance.format} ${balance.symbol}`);
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            `Wallet balance on Zytron Mainnet: ${balance.format} ${balance.symbol}`
          );
        } catch (e) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "An error occurred while checking the wallet balance."
          );
        }
      },
    });
  }

  get sendTokenFunction() {
    return new GameFunction({
      name: "send_token",
      description: "Send token to the specified address on Zytron Mainnet.",
      args: [
        {
          name: "recipient",
          type: "string",
          description: "Recipient address to receive token. Make sure that the recipient address is in the correct format."
        },
        {
          name: "amount",
          type: "string",
          description: "Amount of token to send. Make sure that the amount is in the correct format."
        },
        {
          name: "symbol",
          type: "string",
          description: "Symbol of token to send. Make sure that the symbol is in the correct format."
        }
      ] as const,
      executable: async (args, logger) => {
        try {
          const { recipient, amount, symbol } = args;
          console.log('----', args);
          if (![isAddress(recipient || ''), isValidNumber(amount), symbol].every(Boolean)) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Please ensure all fields are provided correctly."
            );
          }

          if (this.wallet.getAddress() === recipient) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Please ensure the recipient address is different from your wallet address."
            );
          }

          if (!SupportedToken[(symbol || '').toUpperCase()]) {
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Failed,
              "Token is not supported."
            );
          }

          logger(`Sending token: ${symbol} to ${recipient}...`);

          if (symbol?.toLowerCase() === zytron.nativeCurrency.symbol.toLowerCase()) {
            const balance = await this.wallet.getBalance();
            const value = parseUnits(amount!, zytron.nativeCurrency.decimals);
            if (balance.value < value) {
              return new ExecutableGameFunctionResponse(
                ExecutableGameFunctionStatus.Failed,
                "Insufficient balance."
              );
            }
            const hash = await this.wallet.sendNativeToken({
              recipient: recipient as Address,
              value,
            });
            logger(`Transaction hash: ${hash}`);
            return new ExecutableGameFunctionResponse(
              ExecutableGameFunctionStatus.Done,
              `Success! Your transaction has been successfully submitted: ${hash}`
            );
          }

          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "An error occurred while sending the token."
          );
        } catch (e) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "An error occurred while sending token."
          );
        }
      },
    });
  }
}

export default ZytronPlugin;
