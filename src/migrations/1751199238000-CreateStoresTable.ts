import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateStoresTable1751199238000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create stores table
    await queryRunner.createTable(
      new Table({
        name: 'stores',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'logo',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'banner',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'contactInfo',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'address',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'businessHours',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'categories',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'tags',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'rating',
            type: 'decimal',
            precision: 3,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'reviewCount',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'policies',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'settings',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'suspended', 'pending_approval'],
            default: "'pending_approval'",
            isNullable: false,
          },
          {
            name: 'isVerified',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'isFeatured',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'verifiedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'featuredAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'sellerId',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create foreign key for seller relationship
    await queryRunner.createForeignKey(
      'stores',
      new TableForeignKey({
        columnNames: ['sellerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      })
    );

    // Create indexes for better performance
    await queryRunner.createIndex(
      'stores',
      new TableIndex({
        name: 'IDX_STORES_SELLER_ID',
        columnNames: ['sellerId'],
      })
    );

    await queryRunner.createIndex(
      'stores',
      new TableIndex({
        name: 'IDX_STORES_STATUS',
        columnNames: ['status'],
      })
    );

    await queryRunner.createIndex(
      'stores',
      new TableIndex({
        name: 'IDX_STORES_CATEGORIES',
        columnNames: ['categories'],
      })
    );

    await queryRunner.createIndex(
      'stores',
      new TableIndex({
        name: 'IDX_STORES_TAGS',
        columnNames: ['tags'],
      })
    );

    await queryRunner.createIndex(
      'stores',
      new TableIndex({
        name: 'IDX_STORES_RATING',
        columnNames: ['rating'],
      })
    );

    await queryRunner.createIndex(
      'stores',
      new TableIndex({
        name: 'IDX_STORES_CREATED_AT',
        columnNames: ['createdAt'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    const table = await queryRunner.getTable('stores');
    const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('sellerId') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('stores', foreignKey);
    }

    // Drop indexes
    await queryRunner.dropIndex('stores', 'IDX_STORES_SELLER_ID');
    await queryRunner.dropIndex('stores', 'IDX_STORES_STATUS');
    await queryRunner.dropIndex('stores', 'IDX_STORES_CATEGORIES');
    await queryRunner.dropIndex('stores', 'IDX_STORES_TAGS');
    await queryRunner.dropIndex('stores', 'IDX_STORES_RATING');
    await queryRunner.dropIndex('stores', 'IDX_STORES_CREATED_AT');

    // Drop table
    await queryRunner.dropTable('stores');
  }
}
