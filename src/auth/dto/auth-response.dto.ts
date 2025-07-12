import { Exclude, Expose } from 'class-transformer';
import { Role } from '../../common/enums/role.enum';

export class AuthResponseDto {
  @Expose()
  id: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  email: string;

  @Expose()
  phone: string;

  @Expose()
  role: Role;

  @Expose()
  isActive: boolean;

  @Expose()
  isEmailVerified: boolean;

  @Expose()
  isPhoneVerified: boolean;

  @Expose()
  address: string;

  @Expose()
  dateOfBirth: Date;

  @Expose()
  gender: string;

  @Expose()
  profileImage: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  password: string;

  @Exclude()
  emailVerificationToken: string;

  @Exclude()
  phoneVerificationToken: string;

  @Exclude()
  passwordResetToken: string;

  @Exclude()
  passwordResetExpires: Date;
}

export class LoginResponseDto {
  @Expose()
  user: AuthResponseDto;

  @Expose()
  accessToken: string;

  @Expose()
  expiresIn: string;
}