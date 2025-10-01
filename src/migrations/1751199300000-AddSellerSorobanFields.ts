import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSellerSorobanFields1751199300000 implements MigrationInterface {
  name = 'AddSellerSorobanFields1751199300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add payout_wallet column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'payout_wallet',
        type: 'varchar',
        length: '255',
        isNullable: true,
        isUnique: true,
      })
    );

    // Add seller_onchain_registered column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'seller_onchain_registered',
        type: 'boolean',
        default: false,
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'seller_onchain_registered');
    await queryRunner.dropColumn('users', 'payout_wallet');
  }
}
