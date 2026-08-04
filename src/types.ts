export interface Building {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
}

export interface Floor {
  id: string;
  buildingId: string;
  number: number;
  label: string;
  description?: string;
}

export interface RoomType {
  id: string;
  name: string;
  defaultBedCount: number;
  description?: string;
  badgeColor: string; // e.g., 'blue', 'emerald', 'purple', 'amber', 'rose', 'indigo'
}

export interface StatusCategory {
  id: string;
  name: string;
  type: 'room' | 'bed' | 'both';
  color: string; // Hex color or Tailwind color token, e.g., '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'
  description?: string;
  isOccupiedState?: boolean;
  isMaintenanceState?: boolean;
}

export interface BedAssignment {
  memberId: string;
  memberName: string;
  employeeId: string;
  department: string;
  email?: string;
  phone?: string;
  checkInDate: string;
  expectedCheckOutDate?: string;
  notes?: string;
}

export interface Bed {
  id: string;
  roomId: string;
  bedNumber: number; // e.g. 1, 2, 3
  label: string; // e.g., "Bed A", "Bed B", "Top Bunk"
  statusId: string; // ID from StatusCategory
  assignedTo?: BedAssignment | null;
  notes?: string;
}

export interface Room {
  id: string;
  buildingId: string;
  floorId: string;
  roomNumber: string; // e.g., "101", "A-204"
  roomTypeId: string;
  totalBeds: number;
  statusId: string; // ID from StatusCategory
  notes?: string;
  lastCleaned?: string;
  updatedAt: string;
}

export type UserRole = 'Admin' | 'Property Manager' | 'Staff' | 'Tenant';

export interface UserProfile {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  employeeId?: string;
  department?: string;
  assignedBuildingIds?: string[]; // for Property Manager
  assignedBedId?: string; // for Tenant
  phone?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export type MaintenanceCategory =
  | 'Plumbing'
  | 'Electrical'
  | 'HVAC'
  | 'Appliance'
  | 'Furniture'
  | 'Structural'
  | 'Cleaning'
  | 'General';

export type MaintenanceUrgency = 'Low' | 'Medium' | 'High' | 'Urgent';

export type MaintenanceStatus = 'New' | 'In Progress' | 'Pending Parts' | 'Completed' | 'Cancelled';

export interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  urgency: MaintenanceUrgency;
  status: MaintenanceStatus;
  buildingId: string;
  floorId: string;
  roomId: string;
  bedId?: string;
  requesterId: string;
  requesterName: string;
  requesterRole: UserRole;
  contactPhone?: string;
  assignedTechnician?: string;
  assignedTechnicianPhone?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  resolutionNotes?: string;
  updateRoomBedStatusOnComplete?: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: 'ASSIGN' | 'CHECKOUT' | 'ROOM_CREATE' | 'ROOM_UPDATE' | 'STATUS_CHANGE' | 'SETTING_CHANGE' | 'MAINTENANCE_CREATE' | 'MAINTENANCE_UPDATE' | 'USER_CHANGE';
  title: string;
  details: string;
  actor?: string;
}

export interface PropertyData {
  buildings: Building[];
  floors: Floor[];
  roomTypes: RoomType[];
  statuses: StatusCategory[];
  rooms: Room[];
  beds: Bed[];
  logs: ActivityLog[];
  users: UserProfile[];
  maintenanceRequests: MaintenanceRequest[];
}

export type ActiveTab = 'dashboard' | 'inventory' | 'assignments' | 'maintenance' | 'users' | 'tenant-portal' | 'settings';

