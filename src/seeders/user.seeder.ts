import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../common/enums/role.enum';
import * as bcrypt from 'bcryptjs';

export class UserSeeder {
  public static async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);

    // Check if superadmin already exists
    const existingSuperAdmin = await userRepository.findOne({
      where: { role: Role.SUPERADMIN },
    });

    if (existingSuperAdmin) {
      console.log('SuperAdmin already exists, skipping user seeding');
      return;
    }

    const users = [
      {
        firstName: 'Super',
        lastName: 'Admin',
        email: 'superadmin@transport.com',
        password: await bcrypt.hash('SuperAdmin@123', 12),
        role: Role.SUPERADMIN,
        isActive: true,
        isEmailVerified: true,
      },
      {
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@transport.com',
        password: await bcrypt.hash('Admin@123', 12),
        role: Role.ADMIN,
        isActive: true,
        isEmailVerified: true,
      },
      {
        firstName: 'Transport',
        lastName: 'Manager',
        email: 'manager@transport.com',
        password: await bcrypt.hash('Manager@123', 12),
        role: Role.MANAGER,
        isActive: true,
        isEmailVerified: true,
      },
      {
        firstName: 'Finance',
        lastName: 'Accountant',
        email: 'accountant@transport.com',
        password: await bcrypt.hash('Accountant@123', 12),
        role: Role.ACCOUNTANT,
        isActive: true,
        isEmailVerified: true,
      },
      {
        firstName: 'John',
        lastName: 'Driver',
        email: 'driver@transport.com',
        password: await bcrypt.hash('Driver@123', 12),
        role: Role.DRIVER,
        isActive: true,
        isEmailVerified: true,
        phone: '+1234567890',
      },
      {
        firstName: 'Jane',
        lastName: 'Passenger',
        email: 'passenger@transport.com',
        password: await bcrypt.hash('Passenger@123', 12),
        role: Role.PASSENGER,
        isActive: true,
        isEmailVerified: true,
        phone: '+1234567891',
      },
    ];

    for (const userData of users) {
      const user = userRepository.create(userData);
      await userRepository.save(user);
      console.log(`Created user: ${user.email} with role: ${user.role}`);
    }

    console.log('User seeding completed successfully');
  }
}