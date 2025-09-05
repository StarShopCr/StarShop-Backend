import { MigrationInterface, QueryRunner, Table, Index, Check } from 'typeorm';

export class CreateSellerReviewsTable1756000000000 implements MigrationInterface {
  name = 'CreateSellerReviewsTable1756000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create seller_reviews table
    await queryRunner.createTable(
      new Table({
        name: 'seller_reviews',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'offer_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'buyer_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'rating',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'comment',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['offer_id'],
            referencedTableName: 'offers',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['buyer_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        indices: [
          new Index('IDX_seller_reviews_offer_id', ['offer_id']),
          new Index('IDX_seller_reviews_buyer_id', ['buyer_id']),
          new Index('IDX_seller_reviews_created_at', ['created_at']),
        ],
        checks: [
          new Check('CHK_seller_reviews_rating_range', '"rating" >= 1 AND "rating" <= 5'),
        ],
        uniques: [
          {
            name: 'UQ_seller_reviews_offer_buyer',
            columnNames: ['offer_id', 'buyer_id'],
          },
        ],
      }),
      true
    );

    // Add seller rating columns to users table
    await queryRunner.addColumn(
      'users',
      {
        name: 'average_seller_rating',
        type: 'decimal',
        precision: 3,
        scale: 2,
        isNullable: true,
      }
    );

    await queryRunner.addColumn(
      'users',
      {
        name: 'total_seller_reviews',
        type: 'int',
        default: 0,
        isNullable: false,
      }
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove seller rating columns from users table
    await queryRunner.dropColumn('users', 'total_seller_reviews');
    await queryRunner.dropColumn('users', 'average_seller_rating');

    // Drop seller_reviews table
    await queryRunner.dropTable('seller_reviews');
  }
}
