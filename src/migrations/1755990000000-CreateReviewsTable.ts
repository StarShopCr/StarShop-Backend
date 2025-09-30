import { MigrationInterface, QueryRunner, Table, TableUnique } from "typeorm";

export class CreateReviewsTable1695990000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "reviews",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "uuid_generate_v4()"
                    },
                    {
                        name: "offer_id",
                        type: "uuid",
                        isNullable: false
                    },
                    {
                        name: "buyer_id",
                        type: "uuid",
                        isNullable: false
                    },
                    {
                        name: "rating",
                        type: "int",
                        isNullable: false
                    },
                    {
                        name: "comment",
                        type: "text",
                        isNullable: true
                    }
                ]
            })
        );
        await queryRunner.createUniqueConstraint(
            "reviews",
            new TableUnique({
                name: "UQ_offer_buyer_review",
                columnNames: ["offer_id", "buyer_id"]
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("reviews");
    }
}
