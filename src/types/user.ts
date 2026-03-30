export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export interface UserRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
}

export interface UserUpdateRequest {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  phone?: string;
}

export enum UserRole {
  admin = 'admin',
  staff = 'staff',
  owner = 'owner',
  manager = 'manager',
  accountant = 'accountant',
  employee = 'employee',
  superadmin = 'superadmin'
}
