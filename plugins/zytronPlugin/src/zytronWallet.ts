import { Address, createPublicClient, createWalletClient, formatEther, Hex, http, parseUnits, PrivateKeyAccount, PublicClient, WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { zytron } from "./constants";

interface ISendNativeTokenOptions {
  recipient: Address;
  value: bigint;
}

class ZytronWallet {
  private account: PrivateKeyAccount;
  private client: WalletClient;
  private publicClient: PublicClient;

  constructor(pk: string) {
    if (!pk) throw new Error('private key is missing');
    const account = privateKeyToAccount((pk.startsWith("0x") ? pk : `0x${pk}`) as Hex);
    this.account = account;
    this.client = createWalletClient({
      account,
      chain: zytron,
      transport: http(),
    });
    this.publicClient = createPublicClient({
      chain: zytron,
      transport: http(),
    })
  }

  public async getBalance(address?: Address) {
    if (!address) {
      address = this.account.address;
    }
    const balance = await this.publicClient.getBalance({ address });
    return { value: balance, format: formatEther(balance), symbol: zytron.nativeCurrency.symbol };
  }

  public getAddress() {
    return this.account.address;
  }

  public async sendNativeToken(options: ISendNativeTokenOptions): Promise<string> {
    const { recipient, value } = options;
    const hash = await this.client.sendTransaction({
      value,
      account: this.account,
      to: recipient,
      chain: zytron,
    });
    return hash;
  }
}

export default ZytronWallet;
