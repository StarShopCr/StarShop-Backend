import { type MigrationInterface, type QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm"

export class CreateOfferAttachments1746193600000 implements MigrationInterface {
  name = "CreateOfferAttachments1746193600000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create offer_attachments table
    await queryRunner.createTable(
      new Table({
        name: "offer_attachments",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "offer_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "file_url",
            type: "text",
            isNullable: false,
          },
          {
            name: "file_type",
            type: "varchar",
            length: "20",
            isNullable: false,
          },
          {
            name: "file_name",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "file_size",
            type: "integer",
            isNullable: true,
          },
          {
            name: "mime_type",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "provider_type",
            type: "varchar",
            length: "20",
            isNullable: true,
          },
          {
            name: "provider_public_id",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true,
    )

    // Create foreign key constraint
    await queryRunner.createForeignKey(
      "offer_attachments",
      new TableForeignKey({
        columnNames: ["offer_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "offers",
        onDelete: "CASCADE",
        name: "FK_offer_attachments_offer_id",
      }),
    )

    // Create indexes for performance
    await queryRunner.createIndex(
      "offer_attachments",
      new TableIndex({
        name: "IDX_offer_attachments_offer_id",
        columnNames: ["offer_id"],
      }),
    )

    await queryRunner.createIndex(
      "offer_attachments",
      new TableIndex({
        name: "IDX_offer_attachments_file_type",
        columnNames: ["file_type"],
      }),
    )

    await queryRunner.createIndex(
      "offer_attachments",
      new TableIndex({
        name: "IDX_offer_attachments_created_at",
        columnNames: ["created_at"],
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex("offer_attachments", "IDX_offer_attachments_created_at")
    await queryRunner.dropIndex("offer_attachments", "IDX_offer_attachments_file_type")
    await queryRunner.dropIndex("offer_attachments", "IDX_offer_attachments_offer_id")

    // Drop foreign key
    await queryRunner.dropForeignKey("offer_attachments", "FK_offer_attachments_offer_id")

    // Drop table
    await queryRunner.dropTable("offer_attachments")
  }
}
