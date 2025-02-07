export const ENSO_SUPPORTED_CHAINS = new Map<number, string>([
  [1, "ethereum"],
  [10, "optimism"],
  [56, "bnb chain"],
  [100, "gnosis"],
  [137, "polygon"],
  [324, "zksync"],
  [8453, "base"],
  [42161, "arbitrum"],
  [43114, "avalanche"],
  [59144, "linea"],
  [80094, "berachain"],
]);

export const ENSO_ETH = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" as const;

export const ERC20_ABI_MIN = [
  {
    constant: false,
    inputs: [
      {
        name: "_spender",
        type: "address",
      },
      {
        name: "_value",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
