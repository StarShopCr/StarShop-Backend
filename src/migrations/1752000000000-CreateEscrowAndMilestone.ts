import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEscrowAndMilestone1752000000000 implements MigrationInterface {
  name = 'CreateEscrowAndMilestone1752000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "public"."escrow_status_enum" AS ENUM(
        'pending', 'funded', 'released', 'refunded', 'disputed'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."milestone_status_enum" AS ENUM(
        'pending', 'approved', 'rejected', 'released'
      )
    `);

    // Create escrow_accounts table
    await queryRunner.query(`
      CREATE TABLE "escrow_accounts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "offer_id" uuid NOT NULL,
        "buyer_id" integer NOT NULL,
        "seller_id" integer NOT NULL,
        "totalAmount" numeric(12,2) NOT NULL,
        "releasedAmount" numeric(12,2) NOT NULL DEFAULT '0',
        "status" "public"."escrow_status_enum" NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_escrow_accounts" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_escrow_accounts_offer" UNIQUE ("offer_id")
      )
    `);

    // Create milestones table
    await queryRunner.query(`
      CREATE TABLE "milestones" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "escrow_account_id" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "description" text,
        "amount" numeric(12,2) NOT NULL,
        "status" "public"."milestone_status_enum" NOT NULL DEFAULT 'pending',
        "buyer_approved" boolean NOT NULL DEFAULT false,
        "approved_at" TIMESTAMP,
        "released_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_milestones" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "escrow_accounts" 
      ADD CONSTRAINT "FK_escrow_accounts_offer" 
      FOREIGN KEY ("offer_id") 
      REFERENCES "offers"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "escrow_accounts" 
      ADD CONSTRAINT "FK_escrow_accounts_buyer" 
      FOREIGN KEY ("buyer_id") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "escrow_accounts" 
      ADD CONSTRAINT "FK_escrow_accounts_seller" 
      FOREIGN KEY ("seller_id") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "milestones" 
      ADD CONSTRAINT "FK_milestones_escrow" 
      FOREIGN KEY ("escrow_account_id") 
      REFERENCES "escrow_accounts"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_escrow_accounts_offer" ON "escrow_accounts" ("offer_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_escrow_accounts_buyer" ON "escrow_accounts" ("buyer_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_escrow_accounts_seller" ON "escrow_accounts" ("seller_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_escrow_accounts_status" ON "escrow_accounts" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_milestones_escrow" ON "milestones" ("escrow_account_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_milestones_status" ON "milestones" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_milestones_buyer_approved" ON "milestones" ("buyer_approved")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "milestones" DROP CONSTRAINT "FK_milestones_escrow"
    `);

    await queryRunner.query(`
      ALTER TABLE "escrow_accounts" DROP CONSTRAINT "FK_escrow_accounts_seller"
    `);

    await queryRunner.query(`
      ALTER TABLE "escrow_accounts" DROP CONSTRAINT "FK_escrow_accounts_buyer"
    `);

    await queryRunner.query(`
      ALTER TABLE "escrow_accounts" DROP CONSTRAINT "FK_escrow_accounts_offer"
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_milestones_buyer_approved"`);
    await queryRunner.query(`DROP INDEX "IDX_milestones_status"`);
    await queryRunner.query(`DROP INDEX "IDX_milestones_escrow"`);
    await queryRunner.query(`DROP INDEX "IDX_escrow_accounts_status"`);
    await queryRunner.query(`DROP INDEX "IDX_escrow_accounts_seller"`);
    await queryRunner.query(`DROP INDEX "IDX_escrow_accounts_buyer"`);
    await queryRunner.query(`DROP INDEX "IDX_escrow_accounts_offer"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "milestones"`);
    await queryRunner.query(`DROP TABLE "escrow_accounts"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "public"."milestone_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."escrow_status_enum"`);
  }
}
