import { base, baseSepolia } from "@account-kit/infra";
import { IAcpConfig } from "./interface";

const baseSepoliaConfig: IAcpConfig = {
  sdkUrl: "https://sdk-dev.game.virtuals.io",
  registryUrl: "https://acpx-staging.virtuals.io/api/agents",
  alchemyRpcUrl: "https://alchemy-proxy.virtuals.io/api/proxy/rpc",
  alchemyPolicyId: "186aaa4a-5f57-4156-83fb-e456365a8820",
  chain: baseSepolia,
  acpContractAddress: "0x2422c1c43451Eb69Ff49dfD39c4Dc8C5230fA1e6",
  virtualsTokenAddress: "0xbfAB80ccc15DF6fb7185f9498d6039317331846a",
};

const baseConfig: IAcpConfig = {
  sdkUrl: "https://sdk.game.virtuals.io",
  registryUrl: "https://acpx.virtuals.io/api/agents",
  alchemyRpcUrl: "https://alchemy-proxy-prod.virtuals.io/api/proxy/rpc",
  alchemyPolicyId: "186aaa4a-5f57-4156-83fb-e456365a8820",
  chain: base,
  acpContractAddress: "0x6a1FE26D54ab0d3E1e3168f2e0c0cDa5cC0A0A4A",
  virtualsTokenAddress: "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b",
};

export { baseSepoliaConfig, baseConfig };
