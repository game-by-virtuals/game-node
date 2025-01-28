export const ENSO_SUPPORTED_CHAINS = new Set<number>([
  1, 10, 56, 100, 137, 324, 8453, 42161, 43114, 59144, 80000, 11155111,
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
