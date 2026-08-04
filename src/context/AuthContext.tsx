import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole, ModulePermissions, ModuleAccessLevel } from '../types';
import { useProperty } from './PropertyContext';

export interface LoginResult {
  success: boolean;
  errorReason?: 'email_not_found' | 'invalid_password' | 'missing_fields';
}

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, ModulePermissions> = {
  Admin: {
    dashboard: 'full',
    inventory: 'full',
    assignments: 'full',
    maintenance: 'full',
    reports: 'full',
    users: 'full',
    settings: 'full',
  },
  'Property Manager': {
    dashboard: 'full',
    inventory: 'full',
    assignments: 'full',
    maintenance: 'full',
    reports: 'full',
    users: 'view',
    settings: 'full',
  },
  Staff: {
    dashboard: 'view',
    inventory: 'view',
    assignments: 'full',
    maintenance: 'full',
    reports: 'view',
    users: 'none',
    settings: 'none',
  },
  Tenant: {
    dashboard: 'view',
    inventory: 'none',
    assignments: 'view',
    maintenance: 'full',
    reports: 'none',
    users: 'none',
    settings: 'none',
  },
  'View Only (Dashboard & Reports)': {
    dashboard: 'view',
    inventory: 'none',
    assignments: 'none',
    maintenance: 'none',
    reports: 'view',
    users: 'none',
    settings: 'none',
  },
};

interface AuthContextType {
  currentUser: UserProfile;
  isAuthenticated: boolean;
  setCurrentUser: (user: UserProfile) => void;
  switchRole: (role: UserRole) => void;
  switchUserById: (userId: string) => void;
  hasPermission: (permission: AuthPermission) => boolean;
  getModulePermission: (moduleName: keyof ModulePermissions) => ModuleAccessLevel;
  canAccessModule: (moduleName: keyof ModulePermissions) => boolean;
  canEditModule: (moduleName: keyof ModulePermissions) => boolean;
  login: (email: string, password?: string) => LoginResult;
  loginUser: (user: UserProfile) => void;
  logout: () => void;
  isRoleSelectorOpen: boolean;
  setIsRoleSelectorOpen: (open: boolean) => void;
}

export type AuthPermission =
  | 'manage_settings'
  | 'edit_properties'
  | 'delete_properties'
  | 'assign_beds'
  | 'update_bed_status'
  | 'manage_maintenance'
  | 'submit_maintenance'
  | 'manage_users'
  | 'view_all_properties';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'haharu_auth_user_id_v1';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data, addUser } = useProperty();
  const [isRoleSelectorOpen, setIsRoleSelectorOpen] = useState(false);

  const usersList = data?.users || [];

  // Default initial admin user
  const defaultAdminUser: UserProfile = usersList.find((u) => u.role === 'Admin') || {
    id: 'usr-admin-1',
    email: 'admin@haharu.com',
    name: 'James Dalton',
    role: 'Admin',
    employeeId: 'ADM-001',
    department: 'Housing Operations',
    phone: '+1 (555) 011-2233',
  };

  const [currentUser, setCurrentUser] = useState<UserProfile>(defaultAdminUser);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem(AUTH_USER_KEY);
  });

  // Load persisted user or sync with data.users
  useEffect(() => {
    const savedUserId = localStorage.getItem(AUTH_USER_KEY);
    if (savedUserId && usersList.length > 0) {
      const found = usersList.find((u) => u.id === savedUserId);
      if (found) {
        setCurrentUser(found);
        setIsAuthenticated(true);
        return;
      }
    }
  }, [data?.users]);

  const switchUserById = (userId: string) => {
    const target = usersList.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_USER_KEY, target.id);
    }
  };

  const switchRole = (role: UserRole) => {
    // Find an existing user with this role or create a temporary persona
    const found = usersList.find((u) => u.role === role);
    if (found) {
      setCurrentUser(found);
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_USER_KEY, found.id);
    } else {
      const tempUser: UserProfile = {
        id: `usr-${role.toLowerCase().replace(/[^a-z0-9]/g, '-')}-temp`,
        email: `${role.toLowerCase().replace(/[^a-z0-9]/g, '-')}@haharu.com`,
        name: `Sample ${role}`,
        role: role,
        department: 'Operations',
      };
      setCurrentUser(tempUser);
      setIsAuthenticated(true);
    }
  };

  const getModulePermission = (moduleName: keyof ModulePermissions): ModuleAccessLevel => {
    if (currentUser.modulePermissions && currentUser.modulePermissions[moduleName] !== undefined) {
      return currentUser.modulePermissions[moduleName]!;
    }
    const defaultMap = DEFAULT_ROLE_PERMISSIONS[currentUser.role] || DEFAULT_ROLE_PERMISSIONS['Staff'];
    return defaultMap[moduleName] || 'none';
  };

  const canAccessModule = (moduleName: keyof ModulePermissions): boolean => {
    const perm = getModulePermission(moduleName);
    return perm === 'full' || perm === 'view';
  };

  const canEditModule = (moduleName: keyof ModulePermissions): boolean => {
    const perm = getModulePermission(moduleName);
    return perm === 'full';
  };

  const login = (email: string, password?: string): LoginResult => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      return { success: false, errorReason: 'missing_fields' };
    }

    const found = usersList.find((u) => u.email.toLowerCase() === cleanEmail);
    if (found) {
      const userPassword = found.password || '123456';
      if (userPassword === cleanPassword) {
        setCurrentUser(found);
        setIsAuthenticated(true);
        localStorage.setItem(AUTH_USER_KEY, found.id);
        return { success: true };
      } else {
        return { success: false, errorReason: 'invalid_password' };
      }
    }

    // Auto-provision requested admin account if missing from Firestore
    if (cleanEmail === 'aasnad@avanihotels.com') {
      const defaultPass = 'adminpassword';
      if (cleanPassword !== defaultPass && cleanPassword !== '123456') {
        return { success: false, errorReason: 'invalid_password' };
      }
      const newAdmin: UserProfile = {
        id: 'usr-admin-aasnad',
        email: 'aasnad@avanihotels.com',
        password: cleanPassword,
        name: 'Asnaad (Admin)',
        role: 'Admin',
        employeeId: 'ADM-000',
        department: 'Housing Operations',
      };
      addUser({
        email: newAdmin.email,
        password: newAdmin.password,
        name: newAdmin.name,
        role: newAdmin.role,
        employeeId: newAdmin.employeeId,
        department: newAdmin.department,
      });
      setCurrentUser(newAdmin);
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_USER_KEY, newAdmin.id);
      return { success: true };
    }

    return { success: false, errorReason: 'email_not_found' };
  };

  const loginUser = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem(AUTH_USER_KEY, user.id);
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_USER_KEY);
  };

  const hasPermission = (permission: AuthPermission): boolean => {
    const role = currentUser.role;

    if (role === 'View Only (Dashboard & Reports)') {
      if (permission === 'submit_maintenance') return false;
      return false;
    }

    switch (permission) {
      case 'manage_settings':
        return canEditModule('settings') || canEditModule('inventory');
      case 'edit_properties':
        return canEditModule('inventory');
      case 'delete_properties':
        return role === 'Admin' && canEditModule('inventory');
      case 'assign_beds':
        return canEditModule('assignments');
      case 'update_bed_status':
        return canEditModule('assignments') || canEditModule('inventory');
      case 'manage_maintenance':
        return canEditModule('maintenance');
      case 'submit_maintenance':
        return canAccessModule('maintenance');
      case 'manage_users':
        return canEditModule('users');
      case 'view_all_properties':
        return canAccessModule('inventory') || canAccessModule('assignments');
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        setCurrentUser,
        switchRole,
        switchUserById,
        hasPermission,
        getModulePermission,
        canAccessModule,
        canEditModule,
        login,
        loginUser,
        logout,
        isRoleSelectorOpen,
        setIsRoleSelectorOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
