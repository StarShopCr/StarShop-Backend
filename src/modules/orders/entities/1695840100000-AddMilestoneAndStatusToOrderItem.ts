import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMilestoneAndStatusToOrderItem1695840100000 implements MigrationInterface {
    name = 'AddMilestoneAndStatusToOrderItem1695840100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_items" ADD COLUMN "milestone" varchar(255)`);
        await queryRunner.query(`CREATE TYPE "order_item_status_enum" AS ENUM('ACTIVE', 'DISPUTED', 'COMPLETED')`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD COLUMN "status" "order_item_status_enum" NOT NULL DEFAULT 'ACTIVE'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "order_item_status_enum"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "milestone"`);
    }
}
