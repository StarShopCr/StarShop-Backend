import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateUserIdToUUID1751199237000 implements MigrationInterface {
  name = 'MigrateUserIdToUUID1751199237000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, add a new UUID column
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "id_new" UUID DEFAULT gen_random_uuid()`);
    
    // Update existing records to have unique UUIDs
    await queryRunner.query(`UPDATE "users" SET "id_new" = gen_random_uuid() WHERE "id_new" IS NULL`);
    
    // Drop the old id column and rename the new one
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "id_new" TO "id"`);
    
    // Make the new id column the primary key
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")`);
    
    // Ensure walletAddress is unique and indexed
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_walletAddress" ON "users" ("walletAddress")`);
    
    // Update related tables that reference user id
    // Note: This migration assumes other tables will be updated separately
    // to use UUID foreign keys
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to SERIAL id
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "id_old" SERIAL`);
    
    // Drop the UUID primary key constraint
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433"`);
    
    // Rename columns
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "id_old" TO "id"`);
    
    // Restore the SERIAL primary key
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")`);
    
    // Drop the walletAddress index
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_walletAddress"`);
  }
}
