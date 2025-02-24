import AppDataSource from '../config/ormconfig';

export async function setupTestDB() {
  console.log('process.env.NODE_ENV');
  console.log('Initializing database...');
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log('Database initialized.');
  }

  console.log('Synchronizing database...');
  await AppDataSource.synchronize(true);
  console.log('Database synchronized.');
}

export async function teardownTestDB() {
  console.log('Destroying database...');
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('Database destroyed.');
  }
}
