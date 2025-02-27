import AppDataSource from '../config/ormconfig';
import dotenv from 'dotenv';

dotenv.config();

beforeAll(async () => {
  console.log(`[${new Date().toISOString()}] Initializing database...`);
  if (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize();
      console.log(`[${new Date().toISOString()}] Database initialized.`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error during database initialization:`, error);
      throw error;
    }
  }

  if (process.env.NODE_ENV === 'test') {
    console.log(`[${new Date().toISOString()}] Synchronizing database...`);
    try {
      await AppDataSource.synchronize(true); // Drop and recreate the schema
      console.log(`[${new Date().toISOString()}] Database synchronized.`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error during database synchronization:`, error);
      throw error;
    }
  }
});

afterEach(async () => {
  console.log(`[${new Date().toISOString()}] Clearing database...`);
  const entities = AppDataSource.entityMetadatas;
  try {
    await AppDataSource.transaction(async (manager) => {
      for (const entity of entities) {
        await manager.query(`PRAGMA foreign_keys = OFF;`); // SQLite-specific, use equivalent for other DBs
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
  if (AppDataSource.isInitialized) {
    try {
      await AppDataSource.destroy();
      console.log(`[${new Date().toISOString()}] Database destroyed.`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error during database destruction:`, error);
      throw error;
    }
  }
});
