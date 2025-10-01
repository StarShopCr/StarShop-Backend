import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEscrowMetadata1758677273000 implements MigrationInterface {
  name = 'AddEscrowMetadata1758677273000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the onchain_status enum
    await queryRunner.query(`
      CREATE TYPE "public"."orders_onchain_status_enum" AS ENUM(
        'PENDING', 
        'ESCROW_CREATED', 
        'PAYMENT_RECEIVED', 
        'DELIVERED', 
        'COMPLETED', 
        'DISPUTED', 
        'REFUNDED'
      )
    `);

    // Add the new columns to orders table
    await queryRunner.query(`
      ALTER TABLE "orders" 
      ADD COLUMN "escrow_contract_id" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "orders" 
      ADD COLUMN "payment_tx_hash" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "orders" 
      ADD COLUMN "onchain_status" "public"."orders_onchain_status_enum"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the columns
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "onchain_status"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "payment_tx_hash"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "escrow_contract_id"`);
    
    // Drop the enum type
    await queryRunner.query(`DROP TYPE "public"."orders_onchain_status_enum"`);
  }
}
