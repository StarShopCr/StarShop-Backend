import type { SmartContractConfig } from './types';

export const getContractConfig = (): SmartContractConfig => {
  const rpcUrl = process.env.RPC_URL || 'https://sepolia.base.org';
  const chainId = parseInt(process.env.CHAIN_ID || '84532');

  const contracts: SmartContractConfig['contracts'] = {
    token: {
      address: process.env.TOKEN_CONTRACT_ADDRESS || '',
      abi: getContractAbi('token'),
    },
    shop: {
      address: process.env.SHOP_CONTRACT_ADDRESS || '',
      abi: getContractAbi('shop'),
    },
  };

  return { rpcUrl, chainId, contracts };
};

function getContractAbi(name: string): readonly unknown[] {
  const abiEnvVar = `${name.toUpperCase()}_ABI`;
  const abiString = process.env[abiEnvVar as keyof typeof process.env];
  if (abiString) {
    try {
      return JSON.parse(abiString) as readonly unknown[];
    } catch {
      // Fall through to empty ABI
    }
  }
  return [];
}
