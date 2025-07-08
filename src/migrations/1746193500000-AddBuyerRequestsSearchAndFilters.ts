import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddBuyerRequestsSearchAndFilters1746193500000 implements MigrationInterface {
  name = "AddBuyerRequestsSearchAndFilters1746193500000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add expiresAt column if it doesn't exist
    await queryRunner.query(`
      ALTER TABLE "buyer_requests" 
      ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP
    `)

    // Add search vector column for full-text search
    await queryRunner.query(`
      ALTER TABLE "buyer_requests" 
      ADD COLUMN IF NOT EXISTS "searchVector" tsvector
    `)

    // Create function to update search vector
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_buyer_request_search_vector()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."searchVector" := to_tsvector('english', 
          COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.description, '')
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Create trigger to automatically update search vector
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS buyer_request_search_vector_update ON "buyer_requests";
      CREATE TRIGGER buyer_request_search_vector_update
        BEFORE INSERT OR UPDATE ON "buyer_requests"
        FOR EACH ROW EXECUTE FUNCTION update_buyer_request_search_vector();
    `)

    // Update existing records
    await queryRunner.query(`
      UPDATE "buyer_requests" 
      SET "searchVector" = to_tsvector('english', 
        COALESCE(title, '') || ' ' || COALESCE(description, '')
      )
      WHERE "searchVector" IS NULL;
    `)

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_buyer_requests_search" 
      ON "buyer_requests" USING GIN("searchVector")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_buyer_requests_category" 
      ON "buyer_requests"("categoryId")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_buyer_requests_budget" 
      ON "buyer_requests"("budgetMin", "budgetMax")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_buyer_requests_expires_at" 
      ON "buyer_requests"("expiresAt")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_buyer_requests_status" 
      ON "buyer_requests"("status")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_buyer_requests_created_at" 
      ON "buyer_requests"("createdAt")
    `)

    // Composite index for common filter combinations
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_buyer_requests_status_expires" 
      ON "buyer_requests"("status", "expiresAt")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_buyer_requests_category_budget" 
      ON "buyer_requests"("categoryId", "budgetMin", "budgetMax")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_buyer_requests_search"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_buyer_requests_category"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_buyer_requests_budget"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_buyer_requests_expires_at"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_buyer_requests_status"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_buyer_requests_created_at"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_buyer_requests_status_expires"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_buyer_requests_category_budget"`)

    // Drop trigger and function
    await queryRunner.query(`DROP TRIGGER IF EXISTS buyer_request_search_vector_update ON "buyer_requests"`)
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_buyer_request_search_vector()`)

    // Drop columns
    await queryRunner.query(`ALTER TABLE "buyer_requests" DROP COLUMN IF EXISTS "searchVector"`)
    await queryRunner.query(`ALTER TABLE "buyer_requests" DROP COLUMN IF EXISTS "expiresAt"`)
  }
}
