import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddExpiresAtToOffers1746193420634 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add expires_at column
    await queryRunner.addColumn(
      'offers',
      new TableColumn({
        name: 'expires_at',
        type: 'timestamp',
        isNullable: false,
        default: "CURRENT_TIMESTAMP + INTERVAL '7 days'",
      }),
    );

    // Update existing offers to have expires_at = created_at + 7 days
    await queryRunner.query(`
      UPDATE offers 
      SET expires_at = created_at + INTERVAL '7 days' 
      WHERE expires_at IS NULL
    `);

    // Create index on expires_at for better query performance
    await queryRunner.query(`
      CREATE INDEX idx_offers_expires_at ON offers (expires_at)
    `);

    // Create index on status and expires_at for the expiration query
    await queryRunner.query(`
      CREATE INDEX idx_offers_status_expires_at ON offers (status, expires_at)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_offers_status_expires_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_offers_expires_at`);
    
    // Drop expires_at column
    await queryRunner.dropColumn('offers', 'expires_at');
  }
}
