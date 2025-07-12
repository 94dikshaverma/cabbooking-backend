import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { UserSession } from '../entities/user-session.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Role, CAN_CREATE_USERS } from '../common/enums/role.enum';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserSession)
    private sessionRepository: Repository<UserSession>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
    });

    if (user && (await user.validatePassword(password))) {
      return user;
    }

    return null;
  }

  async login(loginDto: LoginDto, ipAddress: string, userAgent?: string) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Update last login
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN');

    // Create session record
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24); // 24 hours

    const session = this.sessionRepository.create({
      userId: user.id,
      token: accessToken,
      ipAddress,
      userAgent,
      expiresAt: expirationDate,
    });

    await this.sessionRepository.save(session);

    return {
      user,
      accessToken,
      expiresIn,
    };
  }

  async register(registerDto: RegisterDto, currentUser?: User) {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Check if phone already exists (if provided)
    if (registerDto.phone) {
      const existingPhone = await this.userRepository.findOne({
        where: { phone: registerDto.phone },
      });

      if (existingPhone) {
        throw new ConflictException('Phone number already exists');
      }
    }

    // Determine the role
    let role = registerDto.role || Role.PASSENGER;

    // If a current user is provided, check permissions
    if (currentUser) {
      const allowedRoles = CAN_CREATE_USERS[currentUser.role] || [];
      
      if (!allowedRoles.includes(role)) {
        throw new ForbiddenException(
          `You don't have permission to create users with role: ${role}`,
        );
      }
    } else {
      // If no current user (public registration), only allow passenger role
      if (role !== Role.PASSENGER) {
        throw new ForbiddenException(
          'Public registration is only allowed for passenger role',
        );
      }
    }

    // Create user
    const user = this.userRepository.create({
      ...registerDto,
      role,
      createdBy: currentUser?.id,
      dateOfBirth: registerDto.dateOfBirth ? new Date(registerDto.dateOfBirth) : null,
    });

    const savedUser = await this.userRepository.save(user);

    return savedUser;
  }

  async logout(userId: string, token: string) {
    await this.sessionRepository.update(
      { userId, token },
      { isActive: false },
    );

    return { message: 'Logged out successfully' };
  }

  async logoutAllSessions(userId: string) {
    await this.sessionRepository.update(
      { userId, isActive: true },
      { isActive: false },
    );

    return { message: 'Logged out from all sessions successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async getUserSessions(userId: string) {
    const sessions = await this.sessionRepository.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });

    return sessions;
  }
}