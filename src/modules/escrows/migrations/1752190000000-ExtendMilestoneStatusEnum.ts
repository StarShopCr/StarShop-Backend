import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendMilestoneStatusEnum1752190000000 implements MigrationInterface {
  name = 'ExtendMilestoneStatusEnum1752190000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Postgres enum alteration strategy: rename old type, create new, alter column, drop old
    await queryRunner.query(`ALTER TYPE "public"."escrow_milestones_status_enum" RENAME TO "escrow_milestones_status_enum_old"`);
    await queryRunner.query(`CREATE TYPE "public"."escrow_milestones_status_enum" AS ENUM('pending','approved','ready','in_progress','delivered')`);
    await queryRunner.query(`ALTER TABLE "escrow_milestones" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "escrow_milestones" ALTER COLUMN "status" TYPE "public"."escrow_milestones_status_enum" USING "status"::text::"public"."escrow_milestones_status_enum"`);
    await queryRunner.query(`ALTER TABLE "escrow_milestones" ALTER COLUMN "status" SET DEFAULT 'pending'`);
    await queryRunner.query(`DROP TYPE "public"."escrow_milestones_status_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."escrow_milestones_status_enum" RENAME TO "escrow_milestones_status_enum_old"`);
    await queryRunner.query(`CREATE TYPE "public"."escrow_milestones_status_enum" AS ENUM('pending','approved')`);
    await queryRunner.query(`ALTER TABLE "escrow_milestones" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "escrow_milestones" ALTER COLUMN "status" TYPE "public"."escrow_milestones_status_enum" USING "status"::text::"public"."escrow_milestones_status_enum"`);
    await queryRunner.query(`ALTER TABLE "escrow_milestones" ALTER COLUMN "status" SET DEFAULT 'pending'`);
    await queryRunner.query(`DROP TYPE "public"."escrow_milestones_status_enum_old"`);
  }
}
