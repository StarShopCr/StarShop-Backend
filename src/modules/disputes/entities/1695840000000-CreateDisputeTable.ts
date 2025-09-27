import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDisputeTable1695840000000 implements MigrationInterface {
    name = 'CreateDisputeTable1695840000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "disputes" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "order_itemId" uuid NOT NULL,
            "buyerId" uuid NOT NULL,
            "status" varchar NOT NULL DEFAULT 'OPEN',
            "reason" text,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_dispute_id" PRIMARY KEY ("id"),
            CONSTRAINT "UQ_dispute_order_item" UNIQUE ("order_itemId"),
            CONSTRAINT "FK_dispute_order_item" FOREIGN KEY ("order_itemId") REFERENCES "order_items"("id") ON DELETE CASCADE,
            CONSTRAINT "FK_dispute_buyer" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE
        )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "disputes"`);
    }
}
