import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTable1734140974017 implements MigrationInterface {
  name = 'CreateUserTable1734140974017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "test_entity" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_cc0413536e3afc0e586996bea40" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "walletAddress" character varying NOT NULL, "name" character varying, "email" character varying, "role" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fc71cd6fb73f95244b23e2ef113" UNIQUE ("walletAddress"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "test_entity"`);
  }
}
