import React, { useState } from 'react';
import { useProperty } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';
import { Bed, AlertTriangle, CheckCircle2, ShieldCheck, Wrench, Users, User, LogOut } from 'lucide-react';
import { RoleSwitcherModal } from './modals/RoleSwitcherModal';

export const Header: React.FC = () => {
  const { activeTab, data } = useProperty();
  const { currentUser, logout } = useAuth();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const titleMap: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Executive Dashboard',
      subtitle: 'Real-time occupancy metrics, available beds, and active maintenance alerts.',
    },
    inventory: {
      title: 'Room Inventory Overview',
      subtitle: 'Manage individual rooms across buildings and customize default bed capacities.',
    },
    assignments: {
      title: 'Bed Assignments & Roster',
      subtitle: 'Assign or check out team members with automatic room status synchronization.',
    },
    maintenance: {
      title: 'Maintenance Request Portal',
      subtitle: 'Track property repairs, assign technicians, update urgency, and complete tickets.',
    },
    users: {
      title: 'User Accounts & Access Control',
      subtitle: 'Manage user profiles, assign roles (Admin, Property Manager, Staff, Tenant).',
    },
    reports: {
      title: 'Reports',
      subtitle: 'Generate and export occupancy, room capacity, bed roster, and maintenance reports in PDF, Excel, and CSV formats.',
    },
    settings: {
      title: 'Property Settings & Controls',
      subtitle: 'Full CRUD management of buildings, floors, room types, and custom statuses.',
    },
  };

  const current = titleMap[activeTab] || titleMap.dashboard;

  const totalBeds = data.beds.length;
  const occupiedBeds = data.beds.filter((b) => b.assignedTo != null).length;
  const openMaintenanceCount = (data.maintenanceRequests || []).filter((r) => r.status !== 'Completed').length;
  const vacantBeds = totalBeds - occupiedBeds;

  const activeBuildingName = data.buildings[0]?.name || 'Main Residential Block';

  return (
    <>
      <header className="h-20 flex items-center justify-between px-8 border-b border-[#E5E5E1] bg-white sticky top-0 z-10 shrink-0 font-sans">
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-bold text-[#1A1A1A]">{current.title}</h1>
          <div className="h-4 w-[1px] bg-[#E5E5E1] hidden md:block"></div>
          <div className="hidden lg:flex space-x-6">
            <div className="text-[10px] uppercase tracking-widest font-bold text-[#A3A39F]">
              Active Property: <span className="text-[#1A1A1A]">{activeBuildingName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Stat Pill 1: Available */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xs bg-[#F9F9F8] border border-[#E5E5E1] text-[#1A1A1A] text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span className="font-bold">{vacantBeds}</span>
            <span className="text-[#666662]">Vacant</span>
          </div>

          {/* Quick Stat Pill 2: Occupied */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xs bg-[#F9F9F8] border border-[#E5E5E1] text-[#1A1A1A] text-xs font-medium">
            <Bed className="w-3.5 h-3.5 text-[#1A1A1A]" />
            <span className="font-bold">{occupiedBeds}</span>
            <span className="text-[#666662]">Assigned</span>
          </div>

          {/* Quick Stat Pill 3: Maintenance Alerts */}
          {openMaintenanceCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xs bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold uppercase tracking-wider">
              <Wrench className="w-3.5 h-3.5 text-amber-600" />
              <span>{openMaintenanceCount} Repairs</span>
            </div>
          )}

          {/* Persona / Role Switcher Trigger Button */}
          <div className="flex items-center space-x-2 pl-4 border-l border-[#E5E5E1]">
            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#333330] text-white rounded-xs transition-all shadow-2xs group"
              title="Click to switch persona or evaluate permissions"
            >
              <div className="w-6 h-6 rounded-full bg-amber-400 text-[#1A1A1A] font-bold text-xs flex items-center justify-center shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                  {currentUser.name}
                </div>
                <div className="text-[9px] text-[#A3A39F] uppercase tracking-wider font-sans font-bold flex items-center gap-1">
                  <span>{currentUser.role}</span>
                  <ShieldCheck className="w-2.5 h-2.5 text-amber-400 inline" />
                </div>
              </div>
            </button>

            <button
              onClick={logout}
              className="flex items-center gap-1 px-2.5 py-1.5 border border-[#E5E5E1] hover:bg-[#F0F0EE] text-[#666662] hover:text-[#9E2A2B] rounded-xs text-[10px] font-bold uppercase tracking-wider transition-colors"
              title="Sign Out of Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />
    </>
  );
};

