import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOfferNotificationTypes1692000000000 implements MigrationInterface {
    name = 'AddOfferNotificationTypes1692000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Actualizar el enum de type para incluir los nuevos valores
        await queryRunner.query(`
      ALTER TYPE "notifications_type_enum" 
      ADD VALUE IF NOT EXISTS 'offer_accepted'
    `);

        await queryRunner.query(`
      ALTER TYPE "notifications_type_enum" 
      ADD VALUE IF NOT EXISTS 'offer_rejected'
    `);

        // 2. Agregar campo payload (jsonb)
        await queryRunner.query(`
      ALTER TABLE "notifications" 
      ADD COLUMN IF NOT EXISTS "payload" jsonb
    `);

        // 3. Agregar campo entityId para deduplicación
        await queryRunner.query(`
      ALTER TABLE "notifications" 
      ADD COLUMN IF NOT EXISTS "entityId" varchar
    `);

        // 4. Crear índice para mejorar performance en deduplicación
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notifications_entity_type_user" 
      ON "notifications" ("entityId", "type", "userId")
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Eliminar índice
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_entity_type_user"`);

        // Eliminar campos
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN IF EXISTS "entityId"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN IF EXISTS "payload"`);

        // Nota: No se pueden eliminar valores de enum en PostgreSQL fácilmente
        // Se requeriría recrear el enum completo, lo cual es más complejo
    }
}