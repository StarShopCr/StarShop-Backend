import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

dotenv.config();

const isTestEnv = process.env.NODE_ENV === 'test';

console.log(`Environment: ${process.env.NODE_ENV}`);
const AppDataSource = new DataSource(
  isTestEnv
    ? {
        type: 'sqlite',
        database: ':memory:',
        entities: [
          __dirname + '/../entities/**/*.{ts,js}',
          __dirname + '/../modules/**/entities/*.{ts,js}',
        ],
        // entities: [__dirname + '/../**/entities/*.{ts,js}'],
        migrations: [__dirname + '/../migrations/*.{ts,js}'],
        synchronize: true,
        logging: false,
      }
    : {
        type: 'postgres',
        url: process.env.DATABASE_URL,
        ssl:
          process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        extra: {
          ssl:
            process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        },
        entities: [
          __dirname + '/../entities/**/*.{ts,js}',
          __dirname + '/../modules/**/entities/*.{ts,js}',
        ],
        migrations: [__dirname + '/../migrations/*.{ts,js}'],
        synchronize: false,
        logging: false,
      }
);

export default AppDataSource;
