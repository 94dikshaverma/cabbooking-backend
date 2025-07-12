import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { UserSeeder } from '../seeders/user.seeder';

async function runSeeders() {
  const configService = new ConfigService();
  
  const dataSource = new DataSource({
    type: 'postgres',
    host: configService.get('DATABASE_HOST') || 'localhost',
    port: configService.get('DATABASE_PORT') || 5432,
    username: configService.get('DATABASE_USERNAME') || 'postgres',
    password: configService.get('DATABASE_PASSWORD') || 'password',
    database: configService.get('DATABASE_NAME') || 'transport_system',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    console.log('Running seeders...');
    await UserSeeder.run(dataSource);
    console.log('Seeders completed successfully');

    await dataSource.destroy();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error running seeders:', error);
    process.exit(1);
  }
}

runSeeders();