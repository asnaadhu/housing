import React, { useState } from 'react';
import { useProperty } from '../context/PropertyContext';
import { Building, Floor, RoomType, StatusCategory } from '../types';
import { BuildingModal } from './modals/BuildingModal';
import { FloorModal } from './modals/FloorModal';
import { RoomTypeModal } from './modals/RoomTypeModal';
import { StatusModal } from './modals/StatusModal';
import {
  Building2,
  Layers,
  Tag,
  Shield,
  Plus,
  Edit2,
  Trash2,
  BedDouble,
  LayoutGrid,
  List,
} from 'lucide-react';

export const PropertySettingsView: React.FC = () => {
  const {
    data,
    deleteBuilding,
    deleteFloor,
    deleteRoomType,
    deleteStatusCategory,
  } = useProperty();

  const [activeSubTab, setActiveSubTab] = useState<'buildings' | 'floors' | 'types' | 'statuses'>('buildings');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Building Modal State
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState<boolean>(false);
  const [buildingToEdit, setBuildingToEdit] = useState<Building | null>(null);

  // Floor Modal State
  const [isFloorModalOpen, setIsFloorModalOpen] = useState<boolean>(false);
  const [floorToEdit, setFloorToEdit] = useState<Floor | null>(null);
  const [selectedBuildingForFloor, setSelectedBuildingForFloor] = useState<string>('');

  // Room Type Modal State
  const [isTypeModalOpen, setIsTypeModalOpen] = useState<boolean>(false);
  const [typeToEdit, setTypeToEdit] = useState<RoomType | null>(null);

  // Status Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [statusToEdit, setStatusToEdit] = useState<StatusCategory | null>(null);

  // Handlers for Building
  const handleOpenAddBuilding = () => {
    setBuildingToEdit(null);
    setIsBuildingModalOpen(true);
  };
  const handleOpenEditBuilding = (b: Building) => {
    setBuildingToEdit(b);
    setIsBuildingModalOpen(true);
  };
  const handleDeleteBuilding = (b: Building) => {
    const associatedRooms = data.rooms.filter((r) => r.buildingId === b.id);
    if (associatedRooms.length > 0) {
      if (
        window.confirm(
          `Building '${b.name}' has ${associatedRooms.length} room(s) configured. Are you sure you want to delete this building along with all its floors, rooms, and bed slots?`
        )
      ) {
        deleteBuilding(b.id, true);
      }
    } else {
      if (window.confirm(`Delete building '${b.name}' (${b.code})?`)) {
        deleteBuilding(b.id, false);
      }
    }
  };

  // Handlers for Floor
  const handleOpenAddFloor = (buildingId?: string) => {
    setFloorToEdit(null);
    setSelectedBuildingForFloor(buildingId || data.buildings[0]?.id || '');
    setIsFloorModalOpen(true);
  };
  const handleOpenEditFloor = (f: Floor) => {
    setFloorToEdit(f);
    setSelectedBuildingForFloor(f.buildingId);
    setIsFloorModalOpen(true);
  };
  const handleDeleteFloor = (f: Floor) => {
    const associatedRooms = data.rooms.filter((r) => r.floorId === f.id);
    if (associatedRooms.length > 0) {
      if (
        window.confirm(
          `Floor '${f.label}' has ${associatedRooms.length} room(s) configured on it. Are you sure you want to delete this floor along with all its rooms and bed slots?`
        )
      ) {
        deleteFloor(f.id, true);
      }
    } else {
      if (window.confirm(`Delete floor '${f.label}'?`)) {
        deleteFloor(f.id, false);
      }
    }
  };

  // Handlers for Room Type
  const handleOpenAddType = () => {
    setTypeToEdit(null);
    setIsTypeModalOpen(true);
  };
  const handleOpenEditType = (rt: RoomType) => {
    setTypeToEdit(rt);
    setIsTypeModalOpen(true);
  };
  const handleDeleteType = (rt: RoomType) => {
    const associatedRooms = data.rooms.filter((r) => r.roomTypeId === rt.id);
    if (associatedRooms.length > 0) {
      if (
        window.confirm(
          `Room type '${rt.name}' is assigned to ${associatedRooms.length} room(s). Delete category and reassign affected rooms to standard default?`
        )
      ) {
        deleteRoomType(rt.id, true);
      }
    } else {
      if (window.confirm(`Delete custom room type '${rt.name}'?`)) {
        deleteRoomType(rt.id, false);
      }
    }
  };

  // Handlers for Status Category
  const handleOpenAddStatus = () => {
    setStatusToEdit(null);
    setIsStatusModalOpen(true);
  };
  const handleOpenEditStatus = (st: StatusCategory) => {
    setStatusToEdit(st);
    setIsStatusModalOpen(true);
  };
  const handleDeleteStatus = (st: StatusCategory) => {
    const inUseCount =
      data.rooms.filter((r) => r.statusId === st.id).length +
      data.beds.filter((b) => b.statusId === st.id).length;

    if (inUseCount > 0) {
      if (
        window.confirm(
          `Status '${st.name}' is currently assigned to ${inUseCount} item(s). Delete status category and reset affected items to Vacant/Available?`
        )
      ) {
        deleteStatusCategory(st.id, true);
      }
    } else {
      if (window.confirm(`Delete status category '${st.name}'?`)) {
        deleteStatusCategory(st.id, false);
      }
    }
  };

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Module Navigation Tabs & View Toggle */}
      <div className="bg-white p-2 border border-[#E5E5E1] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('buildings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xs text-[10px] font-bold uppercase tracking-wider transition-colors ${
              activeSubTab === 'buildings'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'text-[#666662] hover:text-[#1A1A1A] hover:bg-[#F0F0EE]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>1. Buildings & Blocks ({data.buildings.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('floors')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xs text-[10px] font-bold uppercase tracking-wider transition-colors ${
              activeSubTab === 'floors'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'text-[#666662] hover:text-[#1A1A1A] hover:bg-[#F0F0EE]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. Floors & Layouts ({data.floors.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('types')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xs text-[10px] font-bold uppercase tracking-wider transition-colors ${
              activeSubTab === 'types'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'text-[#666662] hover:text-[#1A1A1A] hover:bg-[#F0F0EE]'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>3. Room Types & Defaults ({data.roomTypes.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('statuses')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xs text-[10px] font-bold uppercase tracking-wider transition-colors ${
              activeSubTab === 'statuses'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'text-[#666662] hover:text-[#1A1A1A] hover:bg-[#F0F0EE]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>4. Custom Status Categories ({data.statuses.length})</span>
          </button>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-[#F0F0EE] p-1 border border-[#E5E5E1]">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              viewMode === 'grid'
                ? 'bg-[#1A1A1A] text-white shadow-2xs'
                : 'text-[#666662] hover:text-[#1A1A1A]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Grid View</span>
          </button>

          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              viewMode === 'list'
                ? 'bg-[#1A1A1A] text-white shadow-2xs'
                : 'text-[#666662] hover:text-[#1A1A1A]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List View</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: BUILDINGS & BLOCKS */}
      {activeSubTab === 'buildings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-[#A3A39F] mb-1">
                Property Architecture
              </div>
              <h3 className="text-2xl font-bold text-[#1A1A1A]">
                Buildings & Towers
              </h3>
            </div>
            <button
              onClick={handleOpenAddBuilding}
              className="flex items-center gap-2 px-5 py-3 rounded-xs bg-[#1A1A1A] hover:bg-[#333330] text-white text-[10px] font-bold uppercase tracking-widest transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Building</span>
            </button>
          </div>

          {viewMode === 'list' ? (
            <div className="bg-white border border-[#E5E5E1] shadow-2xs overflow-x-auto">
              <table className="w-full text-left text-xs font-sans border-collapse">
                <thead className="bg-[#1A1A1A] text-white text-[10px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Building Name</th>
                    <th className="py-3 px-4">Floors</th>
                    <th className="py-3 px-4">Rooms</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E1]">
                  {data.buildings.map((bldg) => {
                    const buildingFloors = data.floors.filter((f) => f.buildingId === bldg.id);
                    const buildingRooms = data.rooms.filter((r) => r.buildingId === bldg.id);

                    return (
                      <tr key={bldg.id} className="hover:bg-[#F9F9F8] transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#1A1A1A]">
                          <span className="px-2 py-0.5 bg-[#1A1A1A] text-white text-[10px]">
                            {bldg.code}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-[#1A1A1A]">
                          <div>{bldg.name}</div>
                          {bldg.description && (
                            <p className="text-[10px] text-[#A3A39F] font-normal">{bldg.description}</p>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-[#1A1A1A]">
                          {buildingFloors.length} Floors
                        </td>

                        <td className="py-3.5 px-4 font-bold text-[#1A1A1A]">
                          {buildingRooms.length} Rooms
                        </td>

                        <td className="py-3.5 px-4 text-[#A3A39F] text-[11px] font-mono">
                          {new Date(bldg.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenAddFloor(bldg.id)}
                            className="text-[10px] font-bold text-indigo-700 hover:underline uppercase tracking-wider"
                          >
                            + Add Floor
                          </button>
                          <button
                            onClick={() => handleOpenEditBuilding(bldg)}
                            className="p-1 text-[#1A1A1A] hover:bg-[#F0F0EE] inline-block"
                            title="Edit Building"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBuilding(bldg)}
                            className="p-1 text-rose-700 hover:bg-rose-50 inline-block"
                            title="Delete Building"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.buildings.map((bldg) => {
              const buildingFloors = data.floors.filter((f) => f.buildingId === bldg.id);
              const buildingRooms = data.rooms.filter((r) => r.buildingId === bldg.id);

              return (
                <div
                  key={bldg.id}
                  className="bg-white p-6 border border-[#E5E5E1] shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E1]">
                      <span className="px-2.5 py-1 rounded-xs bg-[#1A1A1A] text-white font-mono font-bold text-[10px] tracking-widest">
                        {bldg.code}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditBuilding(bldg)}
                          className="p-1.5 text-[#A3A39F] hover:text-[#1A1A1A]"
                          title="Rename/Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBuilding(bldg)}
                          className="p-1.5 text-[#A3A39F] hover:text-[#9E2A2B]"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-xl font-bold text-[#1A1A1A] mt-3">{bldg.name}</h4>
                    {bldg.description && (
                      <p className="text-xs text-[#666662] mt-1">{bldg.description}</p>
                    )}

                    <div className="mt-4 pt-3 border-t border-[#E5E5E1] grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-[#F9F9F8] p-3 border border-[#E5E5E1] text-center">
                        <div className="font-bold text-lg text-[#1A1A1A]">{buildingFloors.length}</div>
                        <div className="text-[10px] uppercase tracking-wider font-bold text-[#A3A39F]">Floors</div>
                      </div>
                      <div className="bg-[#F9F9F8] p-3 border border-[#E5E5E1] text-center">
                        <div className="font-bold text-lg text-[#1A1A1A]">{buildingRooms.length}</div>
                        <div className="text-[10px] uppercase tracking-wider font-bold text-[#A3A39F]">Rooms</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-[#E5E5E1] flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-[#A3A39F]">
                    <span>Created: {new Date(bldg.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={() => handleOpenAddFloor(bldg.id)}
                      className="text-[#1A1A1A] hover:underline"
                    >
                      + Add Floor
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}

      {/* SUB-TAB 2: FLOORS & LAYOUTS */}
      {activeSubTab === 'floors' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-[#A3A39F] mb-1">
                Vertical Layouts
              </div>
              <h3 className="text-2xl font-bold text-[#1A1A1A]">Floor Layouts</h3>
            </div>
            <button
              onClick={() => handleOpenAddFloor()}
              className="flex items-center gap-2 px-5 py-3 rounded-xs bg-[#1A1A1A] hover:bg-[#333330] text-white text-[10px] font-bold uppercase tracking-widest transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Floor Level</span>
            </button>
          </div>

          <div className="space-y-6">
            {data.buildings.map((bldg) => {
              const bldgFloors = data.floors.filter((f) => f.buildingId === bldg.id);

              return (
                <div key={bldg.id} className="bg-white p-6 border border-[#E5E5E1] shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E1]">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#1A1A1A]" />
                      <h4 className="font-bold text-[#1A1A1A] text-lg">
                        {bldg.name} <span className="text-xs font-mono text-[#A3A39F]">({bldg.code})</span>
                      </h4>
                    </div>
                    <button
                      onClick={() => handleOpenAddFloor(bldg.id)}
                      className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] border-b border-[#1A1A1A]"
                    >
                      + Add Floor to {bldg.code}
                    </button>
                  </div>

                  {bldgFloors.length === 0 ? (
                    <p className="text-xs text-[#A3A39F] py-2">No floors defined for this building yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bldgFloors.map((flr) => {
                        const floorRooms = data.rooms.filter((r) => r.floorId === flr.id);

                        return (
                          <div
                            key={flr.id}
                            className="p-4 bg-[#F9F9F8] border border-[#E5E5E1] flex items-center justify-between"
                          >
                            <div>
                              <div className="font-bold text-[#1A1A1A] text-base">
                                {flr.label} <span className="text-xs font-sans text-[#A3A39F]">(Level #{flr.number})</span>
                              </div>
                              <div className="text-[10px] uppercase tracking-wider font-bold text-[#A3A39F] mt-1">
                                {floorRooms.length} Rooms Assigned
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditFloor(flr)}
                                className="p-1.5 text-[#A3A39F] hover:text-[#1A1A1A]"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteFloor(flr)}
                                className="p-1.5 text-[#A3A39F] hover:text-[#9E2A2B]"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ROOM TYPES & BED CONFIGURATIONS */}
      {activeSubTab === 'types' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-[#A3A39F] mb-1">
                Category System
              </div>
              <h3 className="text-2xl font-bold text-[#1A1A1A]">
                Room Types & Default Bed Counts
              </h3>
            </div>
            <button
              onClick={handleOpenAddType}
              className="flex items-center gap-2 px-5 py-3 rounded-xs bg-[#1A1A1A] hover:bg-[#333330] text-white text-[10px] font-bold uppercase tracking-widest transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.roomTypes.map((type) => {
              const configuredRoomsCount = data.rooms.filter((r) => r.roomTypeId === type.id).length;

              return (
                <div
                  key={type.id}
                  className="bg-white p-6 border border-[#E5E5E1] shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E1]">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: type.badgeColor || '#1A1A1A' }}
                      />
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditType(type)}
                          className="p-1.5 text-[#A3A39F] hover:text-[#1A1A1A]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteType(type)}
                          className="p-1.5 text-[#A3A39F] hover:text-[#9E2A2B]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-xl font-bold text-[#1A1A1A] mt-3">{type.name}</h4>
                    {type.description && (
                      <p className="text-xs text-[#666662] mt-1 line-clamp-2">{type.description}</p>
                    )}

                    <div className="mt-4 p-3 bg-[#F9F9F8] border border-[#E5E5E1] flex items-center justify-between text-xs">
                      <span className="text-[#666662] font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <BedDouble className="w-3.5 h-3.5 text-[#1A1A1A]" />
                        <span>Default Beds</span>
                      </span>
                      <span className="font-bold text-[#1A1A1A] text-lg">{type.defaultBedCount}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-[#E5E5E1] text-[10px] uppercase tracking-wider font-bold text-[#A3A39F]">
                    {configuredRoomsCount} Rooms Assigned
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: CUSTOM STATUS CATEGORIES */}
      {activeSubTab === 'statuses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-[#A3A39F] mb-1">
                Operational Taxonomy
              </div>
              <h3 className="text-2xl font-bold text-[#1A1A1A]">
                Custom Status Categories
              </h3>
            </div>
            <button
              onClick={handleOpenAddStatus}
              className="flex items-center gap-2 px-5 py-3 rounded-xs bg-[#1A1A1A] hover:bg-[#333330] text-white text-[10px] font-bold uppercase tracking-widest transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Status Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.statuses.map((st) => {
              const roomsWithStatus = data.rooms.filter((r) => r.statusId === st.id).length;
              const bedsWithStatus = data.beds.filter((b) => b.statusId === st.id).length;

              return (
                <div
                  key={st.id}
                  className="bg-white p-6 border border-[#E5E5E1] shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E1]">
                      <span
                        className="px-3 py-1 rounded-xs text-white font-bold text-[10px] uppercase tracking-wider"
                        style={{ backgroundColor: st.color || '#1A1A1A' }}
                      >
                        {st.name}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditStatus(st)}
                          className="p-1.5 text-[#A3A39F] hover:text-[#1A1A1A]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStatus(st)}
                          className="p-1.5 text-[#A3A39F] hover:text-[#9E2A2B]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#A3A39F] mt-3">
                      Target: <span className="text-[#1A1A1A]">{st.type.toUpperCase()}</span>
                    </div>

                    {st.description && (
                      <p className="text-xs text-[#666662] mt-1">{st.description}</p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {st.isOccupiedState && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F0F0EE] text-[#1A1A1A] px-2.5 py-0.5 border border-[#E5E5E1]">
                          Occupied State
                        </span>
                      )}
                      {st.isMaintenanceState && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FDF2F0] text-[#9E2A2B] px-2.5 py-0.5 border border-[#F5C6C2]">
                          Maintenance Alert
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-[#E5E5E1] text-[10px] uppercase tracking-wider font-bold text-[#A3A39F]">
                    In Use: {roomsWithStatus} Rooms & {bedsWithStatus} Beds
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CRUD Modals */}
      <BuildingModal
        isOpen={isBuildingModalOpen}
        onClose={() => setIsBuildingModalOpen(false)}
        buildingToEdit={buildingToEdit}
      />

      <FloorModal
        isOpen={isFloorModalOpen}
        onClose={() => setIsFloorModalOpen(false)}
        floorToEdit={floorToEdit}
        defaultBuildingId={selectedBuildingForFloor}
      />

      <RoomTypeModal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        typeToEdit={typeToEdit}
      />

      <StatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        statusToEdit={statusToEdit}
      />
    </div>
  );
};
