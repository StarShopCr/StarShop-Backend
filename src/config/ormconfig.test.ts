import { DataSource } from "typeorm";
import { TestEntity } from "../entities/testEntity";

export const testDataSource = new DataSource({
  type: "sqlite",
  database: ":memory:",
  synchronize: true,
  entities: [TestEntity],
});
