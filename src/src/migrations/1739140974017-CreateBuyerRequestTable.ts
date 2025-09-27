import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBuyerRequestTable1739140974017 implements MigrationInterface {
  name = 'CreateBuyerRequestTable1739140974017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "buyer_requests" (
        "id" SERIAL NOT NULL,
        "buyerId" INTEGER NOT NULL,
        "categoryId" INTEGER NOT NULL,
        "title" character varying(100) NOT NULL,
        "description" text,
        "budgetMin" numeric(10,2) NOT NULL,
        "budgetMax" numeric(10,2) NOT NULL,
        "status" VARCHAR NOT NULL DEFAULT 'open',
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_buyer_requests_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_buyer" FOREIGN KEY ("buyerId") REFERENCES "users" ("id") ON DELETE CASCADE
      );
      CREATE INDEX "IDX_buyer_id" ON "buyer_requests" ("buyerId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "buyer_requests"`);
  }
}
