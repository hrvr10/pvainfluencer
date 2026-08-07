import { Role } from './types';

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Manager',
  viewer: 'Viewer',
};

export const canEdit = (role?: Role | null) => role === 'admin' || role === 'manager';
export const isAdmin = (role?: Role | null) => role === 'admin';
