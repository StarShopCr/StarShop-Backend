export interface SmartContractConfig {
  rpcUrl: string;
  chainId: number;
  contracts: Record<string, ContractDefinition>;
}

export interface ContractDefinition {
  address: string;
  abi: readonly unknown[];
}

export interface ContractInstance {
  address: string;
  abi: readonly unknown[];
}
