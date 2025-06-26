import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBuyerRequestsAndOffers1746193420634 implements MigrationInterface {
  name = 'CreateBuyerRequestsAndOffers1746193420634';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create buyer_requests table
    await queryRunner.query(`
      CREATE TABLE "buyer_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_buyer_requests" PRIMARY KEY ("id"),
      )
    `);

    // Create offers table
    await queryRunner.query(`
      CREATE TABLE "offers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "request_id" uuid NOT NULL,
        "seller_id" integer NOT NULL,
        "product_id" integer,
        "title" character varying(100) NOT NULL,
        "description" text NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_offers" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_offers_price" CHECK ("price" >= 0),
        CONSTRAINT "CHK_offers_status" CHECK ("status" IN ('pending', 'accepted', 'rejected'))
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "buyer_requests" 
      ADD CONSTRAINT "FK_buyer_requests_buyer_id" 
      FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "offers" 
      ADD CONSTRAINT "FK_offers_request_id" 
      FOREIGN KEY ("request_id") REFERENCES "buyer_requests"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "offers" 
      ADD CONSTRAINT "FK_offers_seller_id" 
      FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "offers" 
      ADD CONSTRAINT "FK_offers_product_id" 
      FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL
    `);

    // Create indexes for better performance
    await queryRunner.query(`CREATE INDEX "IDX_buyer_requests_buyer_id" ON "buyer_requests" ("buyer_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_buyer_requests_status" ON "buyer_requests" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_offers_request_id" ON "offers" ("request_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_offers_seller_id" ON "offers" ("seller_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_offers_status" ON "offers" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_offers_status"`);
    await queryRunner.query(`DROP INDEX "IDX_offers_seller_id"`);
    await queryRunner.query(`DROP INDEX "IDX_offers_request_id"`);
    await queryRunner.query(`DROP INDEX "IDX_buyer_requests_status"`);
    await queryRunner.query(`DROP INDEX "IDX_buyer_requests_buyer_id"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "offers" DROP CONSTRAINT "FK_offers_product_id"`);
    await queryRunner.query(`ALTER TABLE "offers" DROP CONSTRAINT "FK_offers_seller_id"`);
    await queryRunner.query(`ALTER TABLE "offers" DROP CONSTRAINT "FK_offers_request_id"`);
    await queryRunner.query(`ALTER TABLE "buyer_requests" DROP CONSTRAINT "FK_buyer_requests_buyer_id"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "offers"`);
    await queryRunner.query(`DROP TABLE "buyer_requests"`);
  }
}
