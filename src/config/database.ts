import { DataSource } from 'typeorm';
import { config } from './index';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.name,
  synchronize: config.database.synchronize,
  logging: config.database.logging,
  entities: [`${__dirname}/../modules/**/*.entity.{js,ts}`],
  migrations: [`${__dirname}/../migrations/*.{js,ts}`],
});

export default AppDataSource;
