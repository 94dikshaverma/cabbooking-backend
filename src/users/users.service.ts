import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role, CAN_CREATE_USERS, ROLE_HIERARCHY } from '../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto, currentUser: User): Promise<User> {
    // Check if current user can create users with the specified role
    const allowedRoles = CAN_CREATE_USERS[currentUser.role] || [];
    
    if (!allowedRoles.includes(createUserDto.role)) {
      throw new ForbiddenException(
        `You don't have permission to create users with role: ${createUserDto.role}`,
      );
    }

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Check if phone already exists (if provided)
    if (createUserDto.phone) {
      const existingPhone = await this.userRepository.findOne({
        where: { phone: createUserDto.phone },
      });

      if (existingPhone) {
        throw new ConflictException('Phone number already exists');
      }
    }

    const user = this.userRepository.create({
      ...createUserDto,
      createdBy: currentUser.id,
      dateOfBirth: createUserDto.dateOfBirth ? new Date(createUserDto.dateOfBirth) : null,
    });

    return this.userRepository.save(user);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    role?: Role,
    search?: string,
    currentUser?: User,
  ) {
    const skip = (page - 1) * limit;
    
    // Get roles that current user can view
    const viewableRoles = ROLE_HIERARCHY[currentUser.role] || [];
    
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    
    // Filter by viewable roles
    queryBuilder.where('user.role IN (:...roles)', { roles: viewableRoles });
    
    // Filter by specific role if provided
    if (role && viewableRoles.includes(role)) {
      queryBuilder.andWhere('user.role = :role', { role });
    }
    
    // Search functionality
    if (search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    
    queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, currentUser: User): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if current user can view this user
    const viewableRoles = ROLE_HIERARCHY[currentUser.role] || [];
    
    if (!viewableRoles.includes(user.role)) {
      throw new ForbiddenException('You cannot view this user');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUser: User): Promise<User> {
    const user = await this.findOne(id, currentUser);

    // Check if email is being updated and if it already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // Check if phone is being updated and if it already exists
    if (updateUserDto.phone && updateUserDto.phone !== user.phone) {
      const existingPhone = await this.userRepository.findOne({
        where: { phone: updateUserDto.phone },
      });

      if (existingPhone) {
        throw new ConflictException('Phone number already exists');
      }
    }

    // If role is being updated, check permissions
    if (updateUserDto.role && updateUserDto.role !== user.role) {
      const allowedRoles = CAN_CREATE_USERS[currentUser.role] || [];
      
      if (!allowedRoles.includes(updateUserDto.role)) {
        throw new ForbiddenException(
          `You don't have permission to assign role: ${updateUserDto.role}`,
        );
      }
    }

    Object.assign(user, {
      ...updateUserDto,
      dateOfBirth: updateUserDto.dateOfBirth ? new Date(updateUserDto.dateOfBirth) : user.dateOfBirth,
    });

    return this.userRepository.save(user);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const user = await this.findOne(id, currentUser);

    // Prevent deletion of superadmin by non-superadmin
    if (user.role === Role.SUPERADMIN && currentUser.role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Cannot delete superadmin user');
    }

    // Prevent self-deletion
    if (user.id === currentUser.id) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    await this.userRepository.remove(user);
  }

  async toggleStatus(id: string, isActive: boolean, currentUser: User): Promise<User> {
    const user = await this.findOne(id, currentUser);

    // Prevent deactivating superadmin by non-superadmin
    if (user.role === Role.SUPERADMIN && currentUser.role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Cannot modify superadmin status');
    }

    // Prevent self-deactivation
    if (user.id === currentUser.id && !isActive) {
      throw new ForbiddenException('Cannot deactivate your own account');
    }

    user.isActive = isActive;
    return this.userRepository.save(user);
  }
}