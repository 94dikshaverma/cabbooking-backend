import { AppDataSource } from '../config/typeorm.config';
import { UserSeeder } from '../seeders/user.seeder';

async function runSeeders() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');

    console.log('Running seeders...');
    await UserSeeder.run(AppDataSource);
    console.log('Seeders completed successfully');

    await AppDataSource.destroy();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error running seeders:', error);
    process.exit(1);
  }
}

runSeeders();