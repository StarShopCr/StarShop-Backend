import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserFields1751199237000 implements MigrationInterface {
  name = 'AddUserFields1751199237000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to users table
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "location" character varying,
      ADD COLUMN "country" character varying,
      ADD COLUMN "buyerData" jsonb,
      ADD COLUMN "sellerData" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the columns
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN "location",
      DROP COLUMN "country",
      DROP COLUMN "buyerData",
      DROP COLUMN "sellerData"
    `);
  }
}
