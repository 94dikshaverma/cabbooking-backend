import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { Role } from '../common/enums/role.enum';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  create(@Body() createUserDto: CreateUserDto, @CurrentUser() currentUser: User) {
    return this.usersService.create(createUserDto, currentUser);
  }

  @Get()
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.MANAGER)
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('role') role?: Role,
    @Query('search') search?: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.findAll(page, limit, role, search, currentUser);
  }

  @Get(':id')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.MANAGER)
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() currentUser: User) {
    return this.usersService.findOne(id, currentUser);
  }

  @Patch(':id')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.update(id, updateUserDto, currentUser);
  }

  @Delete(':id')
  @Roles(Role.SUPERADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() currentUser: User) {
    return this.usersService.remove(id, currentUser);
  }

  @Patch(':id/activate')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  activate(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() currentUser: User) {
    return this.usersService.toggleStatus(id, true, currentUser);
  }

  @Patch(':id/deactivate')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  deactivate(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() currentUser: User) {
    return this.usersService.toggleStatus(id, false, currentUser);
  }
}