import { Chain } from "viem";

export const zytron = {
  id: 9901,
  name: "Zytron Mainnet",
  nativeCurrency: { name: 'ETHEREUM', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc.zypher.network']
    },
  },
  blockExplorers: {
    default: { name: "Zytron Mainnet Explorer", url: 'https://explorer.zypher.network/' }
  },
  contracts: {
    multicall3: {
      address: '0xa8fAD960aCf062715e1fd3DBD0ee319B2d753b23',
    },
  },
  testnet: false,
} as const satisfies Chain;


export const SupportedToken = {
  ETH: '0x0000000000000000000000000000000000000000',
} as Record<string, string>;

