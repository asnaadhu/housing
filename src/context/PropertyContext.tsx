import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import {
  PropertyData,
  Building,
  Floor,
  RoomType,
  StatusCategory,
  Room,
  Bed,
  BedAssignment,
  ActivityLog,
  UserProfile,
  UserRole,
  MaintenanceRequest,
  MaintenanceCategory,
  MaintenanceUrgency,
  MaintenanceStatus,
} from '../types';
import { INITIAL_PROPERTY_DATA } from '../data/initialData';
import { db, handleFirestoreError, OperationType, validateFirestoreConnection } from '../lib/firebase';

interface PropertyContextType {
  data: PropertyData;
  isLoading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Building Actions
  addBuilding: (name: string, code: string, description?: string) => Promise<void>;
  updateBuilding: (id: string, name: string, code: string, description?: string) => Promise<void>;
  deleteBuilding: (id: string, force?: boolean) => Promise<boolean>;

  // Floor Actions
  addFloor: (buildingId: string, number: number, label: string, description?: string) => Promise<void>;
  updateFloor: (id: string, number: number, label: string, description?: string) => Promise<void>;
  deleteFloor: (id: string, force?: boolean) => Promise<boolean>;

  // Room Type Actions
  addRoomType: (name: string, defaultBedCount: number, description?: string, badgeColor?: string) => Promise<void>;
  updateRoomType: (id: string, name: string, defaultBedCount: number, description?: string, badgeColor?: string) => Promise<void>;
  deleteRoomType: (id: string, force?: boolean) => Promise<boolean>;

  // Status Category Actions
  addStatusCategory: (
    name: string,
    type: 'room' | 'bed' | 'both',
    color: string,
    description?: string,
    isOccupiedState?: boolean,
    isMaintenanceState?: boolean
  ) => Promise<void>;
  updateStatusCategory: (
    id: string,
    name: string,
    type: 'room' | 'bed' | 'both',
    color: string,
    description?: string,
    isOccupiedState?: boolean,
    isMaintenanceState?: boolean
  ) => Promise<void>;
  deleteStatusCategory: (id: string, force?: boolean) => Promise<boolean>;

  // Room Actions
  addRoom: (
    buildingId: string,
    floorId: string,
    roomNumber: string,
    roomTypeId: string,
    customBedCount?: number,
    notes?: string
  ) => Promise<void>;
  updateRoom: (
    id: string,
    roomNumber: string,
    roomTypeId: string,
    totalBeds: number,
    statusId: string,
    notes?: string
  ) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;

  // Bed & Assignment Actions
  assignBed: (bedId: string, memberData: BedAssignment) => Promise<void>;
  checkoutBed: (bedId: string) => Promise<void>;
  updateBedStatus: (bedId: string, statusId: string, notes?: string) => Promise<void>;

  // Maintenance Request Actions
  addMaintenanceRequest: (reqData: {
    title: string;
    description: string;
    category: MaintenanceCategory;
    urgency: MaintenanceUrgency;
    buildingId: string;
    floorId: string;
    roomId: string;
    bedId?: string;
    requesterId: string;
    requesterName: string;
    requesterRole: UserRole;
    contactPhone?: string;
    setRoomBedMaintenance?: boolean;
  }) => Promise<void>;

  updateMaintenanceRequest: (
    id: string,
    updates: Partial<MaintenanceRequest>
  ) => Promise<void>;

  completeMaintenanceRequest: (
    id: string,
    resolutionNotes?: string,
    revertRoomBedStatus?: boolean
  ) => Promise<void>;

  deleteMaintenanceRequest: (id: string) => Promise<void>;

  // User Management Actions
  addUser: (userData: Omit<UserProfile, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<UserProfile>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // Utility
  resetToDefaults: () => Promise<void>;
  saveDataToServer: (newData: PropertyData) => Promise<void>;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

// Helper to calculate room status from beds
const recalculateRoomStatus = (allBeds: Bed[], allStatuses: StatusCategory[], roomId: string, currentRoomStatus: string): string => {
  const roomBeds = allBeds.filter((b) => b.roomId === roomId);
  if (roomBeds.length === 0) return currentRoomStatus;

  const occupiedBeds = roomBeds.filter((b) => {
    const statusObj = allStatuses.find((s) => s.id === b.statusId);
    return b.assignedTo != null || statusObj?.isOccupiedState === true;
  }).length;

  const maintenanceBeds = roomBeds.filter((b) => {
    const statusObj = allStatuses.find((s) => s.id === b.statusId);
    return statusObj?.isMaintenanceState === true;
  }).length;

  if (maintenanceBeds === roomBeds.length) {
    return 'status-maintenance';
  }

  if (occupiedBeds === 0) {
    return 'status-vacant';
  }

  if (occupiedBeds === roomBeds.length) {
    return 'status-occupied';
  }

  return 'status-partially';
};

export function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined) as unknown as T;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = cleanUndefined(value);
    }
  }
  return cleaned as T;
}

// Seed initial data to Firestore
async function seedInitialDataToFirestore(initialData: PropertyData) {
  try {
    const collectionsToSeed: { name: string; items: any[] }[] = [
      { name: 'buildings', items: initialData.buildings },
      { name: 'floors', items: initialData.floors },
      { name: 'roomTypes', items: initialData.roomTypes },
      { name: 'statuses', items: initialData.statuses },
      { name: 'rooms', items: initialData.rooms },
      { name: 'beds', items: initialData.beds },
      { name: 'logs', items: initialData.logs },
      { name: 'users', items: initialData.users },
      { name: 'maintenanceRequests', items: initialData.maintenanceRequests },
    ];

    for (const col of collectionsToSeed) {
      const batch = writeBatch(db);
      for (const item of col.items) {
        const docRef = doc(db, col.name, item.id);
        batch.set(docRef, cleanUndefined(item));
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seed');
  }
}

// Purge old sample data if present in Firestore
async function purgeSampleDataFromFirestore() {
  try {
    const sampleBldgDoc = await getDoc(doc(db, 'buildings', 'bldg-1'));
    if (sampleBldgDoc.exists()) {
      const sampleBldgs = ['bldg-1', 'bldg-2', 'bldg-3'];
      const sampleFloors = ['flr-101', 'flr-102', 'flr-103', 'flr-201', 'flr-202', 'flr-301', 'flr-302'];
      const sampleRooms = ['rm-101', 'rm-102', 'rm-103', 'rm-201', 'rm-202', 'rm-301', 'rm-302', 'rm-303'];
      const sampleUsers = ['usr-pm-1', 'usr-staff-1', 'usr-tenant-1', 'usr-tenant-2'];
      const sampleMaints = ['maint-101', 'maint-102', 'maint-103'];
      const sampleLogs = ['log-1', 'log-2', 'log-3'];

      const batch = writeBatch(db);
      sampleBldgs.forEach((id) => batch.delete(doc(db, 'buildings', id)));
      sampleFloors.forEach((id) => batch.delete(doc(db, 'floors', id)));
      sampleRooms.forEach((id) => batch.delete(doc(db, 'rooms', id)));
      sampleUsers.forEach((id) => batch.delete(doc(db, 'users', id)));
      sampleMaints.forEach((id) => batch.delete(doc(db, 'maintenanceRequests', id)));
      sampleLogs.forEach((id) => batch.delete(doc(db, 'logs', id)));

      const bedsSnap = await getDocs(collection(db, 'beds'));
      bedsSnap.docs.forEach((d) => {
        if (
          d.id.startsWith('bed-101') ||
          d.id.startsWith('bed-102') ||
          d.id.startsWith('bed-103') ||
          d.id.startsWith('bed-201') ||
          d.id.startsWith('bed-202') ||
          d.id.startsWith('bed-301')
        ) {
          batch.delete(d.ref);
        }
      });

      await batch.commit();
    }
  } catch (err) {
    console.warn('Sample data purge error:', err);
  }
}

export const PropertyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<PropertyData>({
    buildings: [],
    floors: [],
    roomTypes: [],
    statuses: [],
    rooms: [],
    beds: [],
    logs: [],
    users: [],
    maintenanceRequests: [],
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Verify connection on startup & clear legacy sample data
  useEffect(() => {
    validateFirestoreConnection();
    purgeSampleDataFromFirestore();
  }, []);

  // Listen to Firestore real-time collections
  useEffect(() => {
    const collectionsState: {
      buildings: Building[];
      floors: Floor[];
      roomTypes: RoomType[];
      statuses: StatusCategory[];
      rooms: Room[];
      beds: Bed[];
      logs: ActivityLog[];
      users: UserProfile[];
      maintenanceRequests: MaintenanceRequest[];
    } = {
      buildings: [],
      floors: [],
      roomTypes: [],
      statuses: [],
      rooms: [],
      beds: [],
      logs: [],
      users: [],
      maintenanceRequests: [],
    };

    let loadedCount = 0;

    const checkAndSetData = (isInitial: boolean) => {
      // Sort logs descending by timestamp
      const sortedLogs = [...collectionsState.logs].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setData({
        buildings: collectionsState.buildings,
        floors: collectionsState.floors,
        roomTypes: collectionsState.roomTypes,
        statuses: collectionsState.statuses,
        rooms: collectionsState.rooms,
        beds: collectionsState.beds,
        logs: sortedLogs,
        users: collectionsState.users,
        maintenanceRequests: collectionsState.maintenanceRequests,
      });

      if (isInitial) {
        setIsLoading(false);
      }
    };

    const unsubBuildings = onSnapshot(
      collection(db, 'buildings'),
      async (snapshot) => {
        if (snapshot.empty && loadedCount === 0) {
          // Empty DB -> Seed initial data
          await seedInitialDataToFirestore(INITIAL_PROPERTY_DATA);
        } else {
          collectionsState.buildings = snapshot.docs.map((d) => d.data() as Building);
          loadedCount++;
          checkAndSetData(loadedCount <= 9);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'buildings')
    );

    const unsubFloors = onSnapshot(
      collection(db, 'floors'),
      (snapshot) => {
        collectionsState.floors = snapshot.docs.map((d) => d.data() as Floor);
        loadedCount++;
        checkAndSetData(loadedCount <= 9);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'floors')
    );

    const unsubRoomTypes = onSnapshot(
      collection(db, 'roomTypes'),
      (snapshot) => {
        collectionsState.roomTypes = snapshot.docs.map((d) => d.data() as RoomType);
        loadedCount++;
        checkAndSetData(loadedCount <= 9);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'roomTypes')
    );

    const unsubStatuses = onSnapshot(
      collection(db, 'statuses'),
      (snapshot) => {
        collectionsState.statuses = snapshot.docs.map((d) => d.data() as StatusCategory);
        loadedCount++;
        checkAndSetData(loadedCount <= 9);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'statuses')
    );

    const unsubRooms = onSnapshot(
      collection(db, 'rooms'),
      (snapshot) => {
        collectionsState.rooms = snapshot.docs.map((d) => d.data() as Room);
        loadedCount++;
        checkAndSetData(loadedCount <= 9);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'rooms')
    );

    const unsubBeds = onSnapshot(
      collection(db, 'beds'),
      (snapshot) => {
        collectionsState.beds = snapshot.docs.map((d) => d.data() as Bed);
        loadedCount++;
        checkAndSetData(loadedCount <= 9);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'beds')
    );

    const unsubLogs = onSnapshot(
      collection(db, 'logs'),
      (snapshot) => {
        collectionsState.logs = snapshot.docs.map((d) => d.data() as ActivityLog);
        loadedCount++;
        checkAndSetData(loadedCount <= 9);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'logs')
    );

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        collectionsState.users = snapshot.docs.map((d) => d.data() as UserProfile);
        loadedCount++;
        checkAndSetData(loadedCount <= 9);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'users')
    );

    const unsubMaintenance = onSnapshot(
      collection(db, 'maintenanceRequests'),
      (snapshot) => {
        collectionsState.maintenanceRequests = snapshot.docs.map((d) => d.data() as MaintenanceRequest);
        loadedCount++;
        checkAndSetData(loadedCount <= 9);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'maintenanceRequests')
    );

    return () => {
      unsubBuildings();
      unsubFloors();
      unsubRoomTypes();
      unsubStatuses();
      unsubRooms();
      unsubBeds();
      unsubLogs();
      unsubUsers();
      unsubMaintenance();
    };
  }, []);

  // Log Writer Helper
  const writeLog = async (action: ActivityLog['action'], title: string, details: string) => {
    try {
      const logId = `log-${Date.now()}`;
      const newLog: ActivityLog = {
        id: logId,
        timestamp: new Date().toISOString(),
        action,
        title,
        details,
        actor: 'Admin',
      };
      await setDoc(doc(db, 'logs', logId), newLog);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'logs');
    }
  };

  // Building Actions
  const addBuilding = async (name: string, code: string, description?: string) => {
    try {
      const newBuilding: Building = {
        id: `bldg-${Date.now()}`,
        name,
        code,
        description,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'buildings', newBuilding.id), newBuilding);
      await writeLog('SETTING_CHANGE', 'Building Added', `Added building ${name} (${code})`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'buildings');
    }
  };

  const updateBuilding = async (id: string, name: string, code: string, description?: string) => {
    try {
      const bRef = doc(db, 'buildings', id);
      await updateDoc(bRef, { name, code, description: description || '' });
      await writeLog('SETTING_CHANGE', 'Building Updated', `Updated building details for ${name}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `buildings/${id}`);
    }
  };

  const deleteBuilding = async (id: string, force = false): Promise<boolean> => {
    try {
      const associatedRooms = data.rooms.filter((r) => r.buildingId === id);
      if (associatedRooms.length > 0 && !force) {
        return false;
      }

      const batch = writeBatch(db);

      // Delete building doc
      batch.delete(doc(db, 'buildings', id));

      // Delete associated floors
      const associatedFloors = data.floors.filter((f) => f.buildingId === id);
      associatedFloors.forEach((f) => batch.delete(doc(db, 'floors', f.id)));

      // Delete associated rooms & beds
      const deletedRoomIds = associatedRooms.map((r) => r.id);
      associatedRooms.forEach((r) => batch.delete(doc(db, 'rooms', r.id)));

      const associatedBeds = data.beds.filter((b) => deletedRoomIds.includes(b.roomId));
      const deletedBedIds = associatedBeds.map((b) => b.id);
      associatedBeds.forEach((b) => batch.delete(doc(db, 'beds', b.id)));

      // Unassign users linked to deleted beds/buildings
      const affectedUsers = (data.users || []).filter(
        (u) =>
          (u.assignedBedId && deletedBedIds.includes(u.assignedBedId)) ||
          u.assignedBuildingIds?.includes(id)
      );

      affectedUsers.forEach((u) => {
        const uRef = doc(db, 'users', u.id);
        const nextBedId = u.assignedBedId && deletedBedIds.includes(u.assignedBedId) ? null : u.assignedBedId;
        const nextBuildings = u.assignedBuildingIds ? u.assignedBuildingIds.filter((bId) => bId !== id) : [];
        batch.update(uRef, {
          assignedBedId: nextBedId,
          assignedBuildingIds: nextBuildings,
        });
      });

      await batch.commit();
      await writeLog('SETTING_CHANGE', 'Building Removed', `Deleted building ID ${id}`);
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `buildings/${id}`);
      return false;
    }
  };

  // Floor Actions
  const addFloor = async (buildingId: string, number: number, label: string, description?: string) => {
    try {
      const newFloor: Floor = {
        id: `flr-${Date.now()}`,
        buildingId,
        number,
        label,
        description,
      };
      await setDoc(doc(db, 'floors', newFloor.id), newFloor);
      await writeLog('SETTING_CHANGE', 'Floor Added', `Added floor ${label} (#${number})`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'floors');
    }
  };

  const updateFloor = async (id: string, number: number, label: string, description?: string) => {
    try {
      await updateDoc(doc(db, 'floors', id), { number, label, description: description || '' });
      await writeLog('SETTING_CHANGE', 'Floor Updated', `Updated floor ${label}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `floors/${id}`);
    }
  };

  const deleteFloor = async (id: string, force = false): Promise<boolean> => {
    try {
      const associatedRooms = data.rooms.filter((r) => r.floorId === id);
      if (associatedRooms.length > 0 && !force) {
        return false;
      }

      const batch = writeBatch(db);
      batch.delete(doc(db, 'floors', id));

      const deletedRoomIds = associatedRooms.map((r) => r.id);
      associatedRooms.forEach((r) => batch.delete(doc(db, 'rooms', r.id)));

      const associatedBeds = data.beds.filter((b) => deletedRoomIds.includes(b.roomId));
      associatedBeds.forEach((b) => batch.delete(doc(db, 'beds', b.id)));

      await batch.commit();
      await writeLog('SETTING_CHANGE', 'Floor Removed', `Deleted floor ID ${id}`);
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `floors/${id}`);
      return false;
    }
  };

  // Room Type Actions
  const addRoomType = async (
    name: string,
    defaultBedCount: number,
    description?: string,
    badgeColor: string = '#3b82f6'
  ) => {
    try {
      const newRoomType: RoomType = {
        id: `rtype-${Date.now()}`,
        name,
        defaultBedCount,
        description,
        badgeColor,
      };
      await setDoc(doc(db, 'roomTypes', newRoomType.id), newRoomType);
      await writeLog('SETTING_CHANGE', 'Room Type Added', `Added custom type ${name}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'roomTypes');
    }
  };

  const updateRoomType = async (
    id: string,
    name: string,
    defaultBedCount: number,
    description?: string,
    badgeColor?: string
  ) => {
    try {
      await updateDoc(doc(db, 'roomTypes', id), {
        name,
        defaultBedCount,
        description: description || '',
        badgeColor: badgeColor || '#3b82f6',
      });
      await writeLog('SETTING_CHANGE', 'Room Type Updated', `Updated room type ${name}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `roomTypes/${id}`);
    }
  };

  const deleteRoomType = async (id: string, force = false): Promise<boolean> => {
    try {
      const associatedRooms = data.rooms.filter((r) => r.roomTypeId === id);
      if (associatedRooms.length > 0 && !force) {
        return false;
      }

      const fallbackType = data.roomTypes.find((rt) => rt.id !== id);
      const batch = writeBatch(db);
      batch.delete(doc(db, 'roomTypes', id));

      associatedRooms.forEach((r) => {
        batch.update(doc(db, 'rooms', r.id), { roomTypeId: fallbackType?.id || 'rtype-std' });
      });

      await batch.commit();
      await writeLog('SETTING_CHANGE', 'Room Type Deleted', `Deleted room type ID ${id}`);
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `roomTypes/${id}`);
      return false;
    }
  };

  // Status Category Actions
  const addStatusCategory = async (
    name: string,
    type: 'room' | 'bed' | 'both',
    color: string,
    description?: string,
    isOccupiedState: boolean = false,
    isMaintenanceState: boolean = false
  ) => {
    try {
      const newStatus: StatusCategory = {
        id: `status-${Date.now()}`,
        name,
        type,
        color,
        description,
        isOccupiedState,
        isMaintenanceState,
      };
      await setDoc(doc(db, 'statuses', newStatus.id), newStatus);
      await writeLog('SETTING_CHANGE', 'Status Category Added', `Added status '${name}'`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'statuses');
    }
  };

  const updateStatusCategory = async (
    id: string,
    name: string,
    type: 'room' | 'bed' | 'both',
    color: string,
    description?: string,
    isOccupiedState?: boolean,
    isMaintenanceState?: boolean
  ) => {
    try {
      await updateDoc(doc(db, 'statuses', id), {
        name,
        type,
        color,
        description: description || '',
        isOccupiedState: isOccupiedState ?? false,
        isMaintenanceState: isMaintenanceState ?? false,
      });
      await writeLog('SETTING_CHANGE', 'Status Category Updated', `Updated status '${name}'`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `statuses/${id}`);
    }
  };

  const deleteStatusCategory = async (id: string, force = false): Promise<boolean> => {
    try {
      const inUseRooms = data.rooms.filter((r) => r.statusId === id);
      const inUseBeds = data.beds.filter((b) => b.statusId === id);
      if ((inUseRooms.length > 0 || inUseBeds.length > 0) && !force) {
        return false;
      }

      const batch = writeBatch(db);
      batch.delete(doc(db, 'statuses', id));

      inUseRooms.forEach((r) => batch.update(doc(db, 'rooms', r.id), { statusId: 'status-vacant' }));
      inUseBeds.forEach((b) => batch.update(doc(db, 'beds', b.id), { statusId: 'status-vacant' }));

      await batch.commit();
      await writeLog('SETTING_CHANGE', 'Status Category Deleted', `Deleted status category ID ${id}`);
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `statuses/${id}`);
      return false;
    }
  };

  // Room Actions
  const addRoom = async (
    buildingId: string,
    floorId: string,
    roomNumber: string,
    roomTypeId: string,
    customBedCount?: number,
    notes?: string
  ) => {
    try {
      const roomType = data.roomTypes.find((rt) => rt.id === roomTypeId);
      const bedCount = customBedCount || roomType?.defaultBedCount || 1;
      const roomId = `rm-${Date.now()}`;

      const newRoom: Room = {
        id: roomId,
        buildingId,
        floorId,
        roomNumber,
        roomTypeId,
        totalBeds: bedCount,
        statusId: 'status-vacant',
        notes,
        lastCleaned: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString(),
      };

      const newBeds: Bed[] = Array.from({ length: bedCount }, (_, i) => ({
        id: `bed-${roomId}-${i + 1}`,
        roomId,
        bedNumber: i + 1,
        label: bedCount === 1 ? 'Master Bed' : `Bed ${i + 1}`,
        statusId: 'status-vacant',
        assignedTo: null,
      }));

      const batch = writeBatch(db);
      batch.set(doc(db, 'rooms', roomId), newRoom);
      newBeds.forEach((b) => batch.set(doc(db, 'beds', b.id), b));

      await batch.commit();
      await writeLog('ROOM_CREATE', 'Room Created', `Created Room #${roomNumber} with ${bedCount} beds`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'rooms');
    }
  };

  const updateRoom = async (
    id: string,
    roomNumber: string,
    roomTypeId: string,
    totalBeds: number,
    statusId: string,
    notes?: string
  ) => {
    try {
      let currentBeds = data.beds.filter((b) => b.roomId === id);
      const batch = writeBatch(db);

      if (totalBeds > currentBeds.length) {
        const addedCount = totalBeds - currentBeds.length;
        for (let i = 0; i < addedCount; i++) {
          const num = currentBeds.length + i + 1;
          const newBed: Bed = {
            id: `bed-${id}-${num}`,
            roomId: id,
            bedNumber: num,
            label: `Bed ${num}`,
            statusId: 'status-vacant',
            assignedTo: null,
          };
          batch.set(doc(db, 'beds', newBed.id), newBed);
        }
      } else if (totalBeds < currentBeds.length) {
        const bedsToRemove = currentBeds.slice(totalBeds);
        bedsToRemove.forEach((b) => batch.delete(doc(db, 'beds', b.id)));
      }

      const updatedRoomData = {
        roomNumber,
        roomTypeId,
        totalBeds,
        statusId,
        notes: notes || '',
        updatedAt: new Date().toISOString(),
      };

      batch.update(doc(db, 'rooms', id), updatedRoomData);

      await batch.commit();
      await writeLog('ROOM_UPDATE', 'Room Updated', `Updated Room #${roomNumber}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rooms/${id}`);
    }
  };

  const deleteRoom = async (id: string) => {
    try {
      const room = data.rooms.find((r) => r.id === id);
      const associatedBeds = data.beds.filter((b) => b.roomId === id);

      const batch = writeBatch(db);
      batch.delete(doc(db, 'rooms', id));
      associatedBeds.forEach((b) => batch.delete(doc(db, 'beds', b.id)));

      await batch.commit();
      await writeLog('ROOM_UPDATE', 'Room Deleted', `Deleted Room #${room?.roomNumber || id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `rooms/${id}`);
    }
  };

  // Bed & Assignment Actions
  const assignBed = async (bedId: string, memberData: BedAssignment) => {
    try {
      const targetBed = data.beds.find((b) => b.id === bedId);
      if (!targetBed) return;

      const batch = writeBatch(db);
      batch.update(doc(db, 'beds', bedId), cleanUndefined({
        statusId: 'status-occupied',
        assignedTo: memberData,
      }));

      // Recalculate room status
      const updatedBeds = data.beds.map((b) =>
        b.id === bedId ? { ...b, statusId: 'status-occupied', assignedTo: memberData } : b
      );
      const calcRoomStatus = recalculateRoomStatus(updatedBeds, data.statuses, targetBed.roomId, 'status-occupied');
      batch.update(doc(db, 'rooms', targetBed.roomId), { statusId: calcRoomStatus, updatedAt: new Date().toISOString() });

      await batch.commit();

      const room = data.rooms.find((r) => r.id === targetBed.roomId);
      await writeLog(
        'ASSIGN',
        'Team Member Assigned',
        `Assigned ${memberData.memberName} to Room #${room?.roomNumber || ''} - ${targetBed.label}`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `beds/${bedId}`);
    }
  };

  const checkoutBed = async (bedId: string) => {
    try {
      const targetBed = data.beds.find((b) => b.id === bedId);
      if (!targetBed) return;

      const assignedName = targetBed.assignedTo?.memberName || 'Member';

      const batch = writeBatch(db);
      batch.update(doc(db, 'beds', bedId), {
        statusId: 'status-vacant',
        assignedTo: null,
      });

      const updatedBeds = data.beds.map((b) =>
        b.id === bedId ? { ...b, statusId: 'status-vacant', assignedTo: null } : b
      );
      const calcRoomStatus = recalculateRoomStatus(updatedBeds, data.statuses, targetBed.roomId, 'status-vacant');
      batch.update(doc(db, 'rooms', targetBed.roomId), { statusId: calcRoomStatus, updatedAt: new Date().toISOString() });

      await batch.commit();

      const room = data.rooms.find((r) => r.id === targetBed.roomId);
      await writeLog(
        'CHECKOUT',
        'Bed Checkout',
        `Checked out ${assignedName} from Room #${room?.roomNumber || ''} - ${targetBed.label}`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `beds/${bedId}`);
    }
  };

  const updateBedStatus = async (bedId: string, statusId: string, notes?: string) => {
    try {
      const targetBed = data.beds.find((b) => b.id === bedId);
      if (!targetBed) return;

      const batch = writeBatch(db);
      const updatePayload: any = { statusId };
      if (notes !== undefined) updatePayload.notes = notes;

      batch.update(doc(db, 'beds', bedId), updatePayload);

      const updatedBeds = data.beds.map((b) => (b.id === bedId ? { ...b, statusId, notes: notes ?? b.notes } : b));
      const calcRoomStatus = recalculateRoomStatus(updatedBeds, data.statuses, targetBed.roomId, statusId);
      batch.update(doc(db, 'rooms', targetBed.roomId), { statusId: calcRoomStatus, updatedAt: new Date().toISOString() });

      await batch.commit();

      const statusObj = data.statuses.find((s) => s.id === statusId);
      await writeLog(
        'STATUS_CHANGE',
        'Bed Status Change',
        `Bed ${targetBed.label} status changed to ${statusObj?.name || statusId}`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `beds/${bedId}`);
    }
  };

  // Maintenance Request Actions
  const addMaintenanceRequest = async (reqData: {
    title: string;
    description: string;
    category: MaintenanceCategory;
    urgency: MaintenanceUrgency;
    buildingId: string;
    floorId: string;
    roomId: string;
    bedId?: string;
    requesterId: string;
    requesterName: string;
    requesterRole: UserRole;
    contactPhone?: string;
    setRoomBedMaintenance?: boolean;
  }) => {
    try {
      const newReqId = `maint-${Date.now()}`;
      const newRequest: MaintenanceRequest = {
        id: newReqId,
        title: reqData.title,
        description: reqData.description,
        category: reqData.category,
        urgency: reqData.urgency,
        status: 'New',
        buildingId: reqData.buildingId,
        floorId: reqData.floorId,
        roomId: reqData.roomId,
        bedId: reqData.bedId,
        requesterId: reqData.requesterId,
        requesterName: reqData.requesterName,
        requesterRole: reqData.requesterRole,
        contactPhone: reqData.contactPhone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updateRoomBedStatusOnComplete: reqData.setRoomBedMaintenance ?? true,
      };

      const batch = writeBatch(db);
      batch.set(doc(db, 'maintenanceRequests', newReqId), cleanUndefined(newRequest));

      if (reqData.setRoomBedMaintenance) {
        if (reqData.bedId) {
          batch.update(doc(db, 'beds', reqData.bedId), { statusId: 'status-maintenance' });
        }
        if (reqData.roomId) {
          batch.update(doc(db, 'rooms', reqData.roomId), { statusId: 'status-maintenance' });
        }
      }

      await batch.commit();
      await writeLog(
        'MAINTENANCE_CREATE',
        'Maintenance Request Created',
        `Created [${reqData.urgency}] request: "${reqData.title}" by ${reqData.requesterName}`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'maintenanceRequests');
    }
  };

  const updateMaintenanceRequest = async (id: string, updates: Partial<MaintenanceRequest>) => {
    try {
      const targetReq = data.maintenanceRequests.find((r) => r.id === id);
      await updateDoc(doc(db, 'maintenanceRequests', id), cleanUndefined({
        ...updates,
        updatedAt: new Date().toISOString(),
      }));
      await writeLog(
        'MAINTENANCE_UPDATE',
        'Maintenance Request Updated',
        `Updated maintenance request "${targetReq?.title || id}"`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `maintenanceRequests/${id}`);
    }
  };

  const completeMaintenanceRequest = async (
    id: string,
    resolutionNotes?: string,
    revertRoomBedStatus: boolean = true
  ) => {
    try {
      const targetReq = data.maintenanceRequests.find((r) => r.id === id);
      if (!targetReq) return;

      const batch = writeBatch(db);
      batch.update(doc(db, 'maintenanceRequests', id), cleanUndefined({
        status: 'Completed',
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        resolutionNotes: resolutionNotes || targetReq.resolutionNotes || 'Maintenance completed successfully.',
      }));

      if (revertRoomBedStatus) {
        if (targetReq.bedId) {
          const bed = data.beds.find((b) => b.id === targetReq.bedId);
          if (bed && bed.statusId === 'status-maintenance') {
            const nextBedStatus = bed.assignedTo ? 'status-occupied' : 'status-vacant';
            batch.update(doc(db, 'beds', targetReq.bedId), { statusId: nextBedStatus });
          }
        }

        if (targetReq.roomId) {
          const room = data.rooms.find((r) => r.id === targetReq.roomId);
          if (room && room.statusId === 'status-maintenance') {
            batch.update(doc(db, 'rooms', targetReq.roomId), { statusId: 'status-vacant' });
          }
        }
      }

      await batch.commit();
      await writeLog('MAINTENANCE_UPDATE', 'Maintenance Completed', `Completed request: "${targetReq.title}"`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `maintenanceRequests/${id}`);
    }
  };

  const deleteMaintenanceRequest = async (id: string) => {
    try {
      const targetReq = data.maintenanceRequests.find((r) => r.id === id);
      await deleteDoc(doc(db, 'maintenanceRequests', id));
      await writeLog('MAINTENANCE_UPDATE', 'Maintenance Deleted', `Deleted request "${targetReq?.title || id}"`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `maintenanceRequests/${id}`);
    }
  };

  // User Management Actions
  const addUser = async (userData: Omit<UserProfile, 'id' | 'createdAt'>) => {
    try {
      const userId = `usr-${Date.now()}`;
      const newUser: UserProfile = {
        ...userData,
        id: userId,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', userId), cleanUndefined(newUser));
      await writeLog('USER_CHANGE', 'User Added', `Added user ${userData.name} (${userData.role})`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'users');
    }
  };

  const updateUser = async (id: string, updates: Partial<UserProfile>) => {
    try {
      const targetUser = data.users.find((u) => u.id === id);
      await updateDoc(doc(db, 'users', id), cleanUndefined(updates));
      await writeLog('USER_CHANGE', 'User Updated', `Updated user profile for ${targetUser?.name || id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${id}`);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const targetUser = data.users.find((u) => u.id === id);
      await deleteDoc(doc(db, 'users', id));
      await writeLog('USER_CHANGE', 'User Deleted', `Deleted user ${targetUser?.name || id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${id}`);
    }
  };

  // Reset all Firestore data back to default initial state
  const resetToDefaults = async () => {
    try {
      const collectionsList = ['buildings', 'floors', 'roomTypes', 'statuses', 'rooms', 'beds', 'logs', 'users', 'maintenanceRequests'];
      for (const colName of collectionsList) {
        const snap = await getDocs(collection(db, colName));
        const batch = writeBatch(db);
        snap.docs.forEach((docSnap) => batch.delete(docSnap.ref));
        await batch.commit();
      }
      await seedInitialDataToFirestore(INITIAL_PROPERTY_DATA);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'reset');
    }
  };

  const saveDataToServer = async (newData: PropertyData) => {
    try {
      await seedInitialDataToFirestore(newData);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'saveData');
    }
  };

  return (
    <PropertyContext.Provider
      value={{
        data,
        isLoading,
        activeTab,
        setActiveTab,

        addBuilding,
        updateBuilding,
        deleteBuilding,

        addFloor,
        updateFloor,
        deleteFloor,

        addRoomType,
        updateRoomType,
        deleteRoomType,

        addStatusCategory,
        updateStatusCategory,
        deleteStatusCategory,

        addRoom,
        updateRoom,
        deleteRoom,

        assignBed,
        checkoutBed,
        updateBedStatus,

        addMaintenanceRequest,
        updateMaintenanceRequest,
        completeMaintenanceRequest,
        deleteMaintenanceRequest,

        addUser,
        updateUser,
        deleteUser,

        resetToDefaults,
        saveDataToServer,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
};

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};
