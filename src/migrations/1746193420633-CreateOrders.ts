import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrders1746193420633 implements MigrationInterface {
  name = 'CreateOrders1746193420633';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."orders_status_enum" AS ENUM('PENDING', 'PAID', 'SHIPPED', 'CANCELLED')
        `);

    await queryRunner.query(`
            CREATE TABLE "orders" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "status" "public"."orders_status_enum" NOT NULL DEFAULT 'PENDING',
                "total_price" decimal(10,2) NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_orders" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "order_items" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "order_id" uuid NOT NULL,
                "product_id" uuid NOT NULL,
                "quantity" integer NOT NULL,
                "price" decimal(10,2) NOT NULL,
                CONSTRAINT "PK_order_items" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            ALTER TABLE "orders" 
            ADD CONSTRAINT "FK_orders_user" 
            FOREIGN KEY ("user_id") 
            REFERENCES "users"("id") 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "order_items" 
            ADD CONSTRAINT "FK_order_items_order" 
            FOREIGN KEY ("order_id") 
            REFERENCES "orders"("id") 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "order_items" 
            ADD CONSTRAINT "FK_order_items_product" 
            FOREIGN KEY ("product_id") 
            REFERENCES "products"("id") 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_product"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_order"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_user"`);
    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
  }
}
