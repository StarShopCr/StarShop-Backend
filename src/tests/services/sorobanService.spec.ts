import { SorobanService } from '../../services/sorobanService';

jest.mock('soroban-client', () => {
  const originalModule = jest.requireActual('soroban-client');
  return {
    ...originalModule,
    Server: jest.fn().mockImplementation(() => ({
      getAccount: jest.fn().mockResolvedValue({
        accountId: () => 'GTEST',
        sequence: '12345',
      }),
      sendTransaction: jest.fn().mockResolvedValue({ hash: 'mocked_hash' }),
    })),
    Keypair: {
      fromSecret: jest.fn().mockReturnValue({
        publicKey: jest.fn().mockReturnValue('GMOCK'),
        sign: jest.fn(),
      }),
    },
    TransactionBuilder: jest.fn().mockImplementation(() => ({
      addOperation: jest.fn().mockReturnThis(),
      setTimeout: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue({
        sign: jest.fn(),
      }),
    })),
    Networks: {
      FUTURENET: 'TestNet',
    },
    xdr: {},
  };
});

describe('SorobanService', () => {
  describe('submitTransaction', () => {
    it('should throw error if XDR is invalid or empty', async () => {
      await expect(SorobanService.submitTransaction('')).rejects.toThrow(
        'Invalid transaction XDR: must be a non-empty base64 string.'
      );
    });

    it('should submit a valid transaction and return hash', async () => {
      // Mock fromXDR for this test case
      const mockTx = { sign: jest.fn() };
      const mockFromXDR = jest.fn().mockReturnValue(mockTx);

      const { TransactionBuilder } = require('soroban-client');
      TransactionBuilder.fromXDR = mockFromXDR;

      const mockXDR = 'AAAAAgAAAADFAKEBASE64STRING==';
      const result = await SorobanService.submitTransaction(mockXDR);
      expect(result).toBe('mocked_hash');
      expect(mockFromXDR).toHaveBeenCalledWith(mockXDR, 'TestNet');
    });
  });

  describe('invokeContractMethod', () => {
    it('should invoke a contract method successfully', async () => {
      const result = await SorobanService.invokeContractMethod('fake-contract-id', 'mint', [
        'arg1',
      ]);
      expect(result).toEqual({ hash: 'mocked_hash' });
    });
  });
});
