import { Server, Keypair, xdr, TransactionBuilder, Networks, SorobanRpc } from 'soroban-client';
import * as dotenv from 'dotenv';

dotenv.config();

const { SOROBAN_RPC_URL, SOROBAN_SERVER_SECRET } = process.env;

if (!SOROBAN_RPC_URL || !SOROBAN_SERVER_SECRET) {
  throw new Error('Missing Soroban config in environment variables.');
}

// Setup server and keys
const server = new Server(SOROBAN_RPC_URL);
const keypair = Keypair.fromSecret(SOROBAN_SERVER_SECRET);
const publicKey = keypair.publicKey();

export class SorobanService {
  private static server = server;
  private static keypair = keypair;

  /**
   * Submit a signed transaction to the Soroban blockchain.
   * @param transactionXDR - Base64-encoded transaction XDR string.
   * @returns Transaction hash if successful.
   */

  //REUSEABLE submitTransaction FN
  static async submitTransaction(transactionXDR: string): Promise<string> {
    if (!transactionXDR || typeof transactionXDR !== 'string') {
      throw new Error('Invalid transaction XDR: must be a non-empty base64 string.');
    }

    try {
      const tx = TransactionBuilder.fromXDR(transactionXDR, Networks.FUTURENET);
      const response = await this.server.sendTransaction(tx);
      return response.hash;
    } catch (error) {
      console.error('SorobanService - submitTransaction error:', error);
      throw new Error('Failed to submit transaction to Soroban network.');
    }
  }

  /**
   * Invoke a contract method with provided arguments.
   * @param contractId - ID of the deployed contract.
   * @param methodName - The method to invoke on the contract.
   * @param args - Arguments for the method call.
   * @returns Result from contract call.
   */

  //REUSEABLE invokeContractMethod FN
  static async invokeContractMethod(
    contractId: string,
    methodName: string,
    args: any[]
  ): Promise<any> {
    try {
      const account = await this.server.getAccount(publicKey);

      const tx = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: Networks.FUTURENET,
      })
        .addOperation({
          type: 'invokeHostFunction',
          contractId,
          function: methodName,
          args,
        } as any) // TypeScript workaround: soroban-client types may not fully support invokeHostFunction
        .setTimeout(30)
        .build();

      tx.sign(this.keypair);

      const response = await this.server.sendTransaction(tx);
      return response;
    } catch (error) {
      console.error('SorobanService - invokeContractMethod error:', error);
      throw new Error('Failed to invoke smart contract method.');
    }
  }
}
