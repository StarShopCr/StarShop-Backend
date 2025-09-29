import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEscrowTables1756199900000 implements MigrationInterface {
  name = 'CreateEscrowTables1756199900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "escrows" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "expected_signer" varchar(100) NOT NULL,
      "balance" numeric(30,10) NOT NULL DEFAULT 0,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "escrow_funding_txs" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "tx_hash" varchar(150) NOT NULL,
      "amount" numeric(30,10) NOT NULL,
      "escrow_id" uuid NOT NULL REFERENCES escrows(id) ON DELETE CASCADE,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS escrow_funding_txs_escrow_id_idx ON escrow_funding_txs(escrow_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "escrow_funding_txs"');
    await queryRunner.query('DROP TABLE IF EXISTS "escrows"');
  }
}
