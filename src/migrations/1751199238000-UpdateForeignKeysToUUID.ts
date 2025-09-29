import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateForeignKeysToUUID1751199238000 implements MigrationInterface {
  name = 'UpdateForeignKeysToUUID1751199238000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update user_roles table
    await queryRunner.query(`ALTER TABLE "user_roles" ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid`);
    
    // Update buyer_requests table
    await queryRunner.query(`ALTER TABLE "buyer_requests" ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid`);
    
    // Update reviews table
    await queryRunner.query(`ALTER TABLE "reviews" ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid`);
    
    // Note: carts and orders already use UUID for user_id
    
    // Add foreign key constraints if they don't exist
    await queryRunner.query(`
      ALTER TABLE "user_roles" 
      ADD CONSTRAINT "FK_user_roles_user" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    
    await queryRunner.query(`
      ALTER TABLE "buyer_requests" 
      ADD CONSTRAINT "FK_buyer_requests_user" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD CONSTRAINT "FK_reviews_user" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    
    await queryRunner.query(`
      ALTER TABLE "carts" 
      ADD CONSTRAINT "FK_carts_user" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    
    await queryRunner.query(`
      ALTER TABLE "orders" 
      ADD CONSTRAINT "FK_orders_user" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT IF EXISTS "FK_user_roles_user"`);
    await queryRunner.query(`ALTER TABLE "buyer_requests" DROP CONSTRAINT IF EXISTS "FK_buyer_requests_user"`);
    await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "FK_reviews_user"`);
    await queryRunner.query(`ALTER TABLE "carts" DROP CONSTRAINT IF EXISTS "FK_carts_user"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "FK_orders_user"`);
    
    // Revert column types to integer (this will require data migration in a real scenario)
    await queryRunner.query(`ALTER TABLE "user_roles" ALTER COLUMN "userId" TYPE INTEGER USING "userId"::integer`);
    await queryRunner.query(`ALTER TABLE "buyer_requests" ALTER COLUMN "userId" TYPE INTEGER USING "userId"::integer`);
    await queryRunner.query(`ALTER TABLE "reviews" ALTER COLUMN "userId" TYPE INTEGER USING "userId"::integer`);
  }
}
