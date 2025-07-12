export enum Role {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  ACCOUNTANT = 'accountant',
  DRIVER = 'driver',
  PASSENGER = 'passenger',
}

export const ROLE_HIERARCHY = {
  [Role.SUPERADMIN]: [
    Role.SUPERADMIN,
    Role.ADMIN,
    Role.MANAGER,
    Role.ACCOUNTANT,
    Role.DRIVER,
    Role.PASSENGER,
  ],
  [Role.ADMIN]: [Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT, Role.DRIVER, Role.PASSENGER],
  [Role.MANAGER]: [Role.MANAGER, Role.ACCOUNTANT],
  [Role.ACCOUNTANT]: [Role.ACCOUNTANT],
  [Role.DRIVER]: [Role.DRIVER],
  [Role.PASSENGER]: [Role.PASSENGER],
};

export const CAN_CREATE_USERS = {
  [Role.SUPERADMIN]: [Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT, Role.DRIVER, Role.PASSENGER],
  [Role.ADMIN]: [Role.MANAGER, Role.ACCOUNTANT, Role.DRIVER, Role.PASSENGER],
  [Role.MANAGER]: [],
  [Role.ACCOUNTANT]: [],
  [Role.DRIVER]: [],
  [Role.PASSENGER]: [],
};