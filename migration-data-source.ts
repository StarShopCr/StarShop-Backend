import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const MigrationDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [
    __dirname + '/modules/**/*.entity.{js,ts}',
  ],
  migrations: [
    __dirname + '/migrations/*.{js,ts}',
  ],
  synchronize: false,
  logging: false,
});

export default MigrationDataSource;
