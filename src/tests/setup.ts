import { DataSource } from 'typeorm';
import { Coupon, CouponUsage } from '../modules/coupons/entities/coupon.entity';
import dotenv from 'dotenv';

dotenv.config();

// Create a shared SQLite in-memory DataSource for testing
const dataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  entities: [Coupon, CouponUsage],
  synchronize: true,
});

beforeAll(async () => {
  console.log(`[${new Date().toISOString()}] Initializing database...`);
  if (!dataSource.isInitialized) {
    try {
      await dataSource.initialize();
      console.log(`[${new Date().toISOString()}] Database initialized.`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error during database initialization:`, error);
      throw error;
    }
  }

  if (process.env.NODE_ENV === 'test') {
    console.log(`[${new Date().toISOString()}] Synchronizing database...`);
    try {
      await dataSource.synchronize(true); // Drop and recreate the schema
      console.log(`[${new Date().toISOString()}] Database synchronized.`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error during database synchronization:`, error);
      throw error;
    }
  }
});

afterEach(async () => {
  console.log(`[${new Date().toISOString()}] Clearing database...`);
  const entities = dataSource.entityMetadatas;
  try {
    await dataSource.transaction(async (manager) => {
      for (const entity of entities) {
        await manager.query(`PRAGMA foreign_keys = OFF;`);
        await manager.query(`DELETE FROM ${entity.tableName};`);
        await manager.query(`PRAGMA foreign_keys = ON;`);
      }
    });
    console.log(`[${new Date().toISOString()}] Database cleared.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error clearing database:`, error);
    throw error;
  }
});

afterAll(async () => {
  console.log(`[${new Date().toISOString()}] Destroying database...`);
  if (dataSource.isInitialized) {
    try {
      await dataSource.destroy();
      console.log(`[${new Date().toISOString()}] Database destroyed.`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error during database destruction:`, error);
      throw error;
    }
  }
});

export { dataSource };
