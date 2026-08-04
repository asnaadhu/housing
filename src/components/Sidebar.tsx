import React from 'react';
import { useProperty } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  BedDouble,
  Settings,
  Wrench,
  Users,
  User,
  ShieldCheck,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, data } = useProperty();
  const { currentUser, setIsRoleSelectorOpen, hasPermission } = useAuth();

  const openMaintenanceCount = (data.maintenanceRequests || []).filter(
    (r) => r.status !== 'Completed'
  ).length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      show: true,
    },
    {
      id: 'inventory',
      label: 'Room Inventory',
      icon: Building2,
      badge: data.rooms.length.toString(),
      show: currentUser.role !== 'Tenant',
    },
    {
      id: 'assignments',
      label: 'Bed Assignments',
      icon: BedDouble,
      badge: data.beds.filter((b) => b.assignedTo != null).length.toString(),
      show: currentUser.role !== 'Tenant',
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: Wrench,
      badge: openMaintenanceCount > 0 ? openMaintenanceCount.toString() : null,
      show: true,
    },
    {
      id: 'tenant-portal',
      label: 'Resident Portal',
      icon: User,
      badge: 'Mine',
      show: currentUser.role === 'Tenant' || currentUser.role === 'Admin',
    },
    {
      id: 'users',
      label: 'User Accounts',
      icon: Users,
      badge: (data.users || []).length.toString(),
      show: hasPermission('manage_users') || currentUser.role === 'Property Manager',
    },
    {
      id: 'settings',
      label: 'Property Settings',
      icon: Settings,
      badge: null,
      show: hasPermission('manage_settings'),
    },
  ];

  const visibleNavItems = navItems.filter((item) => item.show);

  const occupiedBedsCount = data.beds.filter((b) => b.assignedTo != null).length;
  const totalBedsCount = data.beds.length;
  const capacityPercent = totalBedsCount > 0 ? Math.round((occupiedBedsCount / totalBedsCount) * 100) : 0;

  return (
    <aside className="w-64 bg-white text-[#1A1A1A] flex flex-col h-screen border-r border-[#E5E5E1] shrink-0 sticky top-0 font-sans">
      {/* Brand Header */}
      <div className="p-8 pb-6">
        <div className="text-[10px] tracking-[0.2em] font-bold uppercase text-[#A3A39F] mb-1">
          Housing System
        </div>
        <div className="text-2xl font-bold text-[#1A1A1A] tracking-tight flex items-center gap-2">
          <span>Haharu</span>
          <span className="text-[9px] font-sans font-bold uppercase tracking-wider px-1.5 py-0.5 bg-[#1A1A1A] text-white">
            v2.4
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <div className="px-4 py-2 text-[10px] font-bold text-[#A3A39F] uppercase tracking-[0.2em]">
          Core Navigation
        </div>

        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xs text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'text-[#666662] hover:bg-[#F0F0EE] hover:text-[#1A1A1A]'
              }`}
            >
              <div className="flex items-center gap-3">
                {isActive ? (
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                ) : (
                  <Icon className="w-4 h-4 text-[#A3A39F]" />
                )}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold tracking-wider rounded-xs font-sans ${
                    isActive
                      ? 'bg-amber-400 text-[#1A1A1A]'
                      : 'bg-[#F0F0EE] text-[#666662]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Status Box */}
      <div className="p-4 mx-4 my-2 bg-[#F9F9F8] border border-[#E5E5E1] rounded-xs text-xs">
        <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#A3A39F] mb-1">
          Property Capacity
        </div>
        <div className="flex items-center justify-between font-bold text-base text-[#1A1A1A] mb-2">
          <span>{occupiedBedsCount} / {totalBedsCount} Beds</span>
          <span className="text-xs font-bold text-[#1A1A1A]">{capacityPercent}%</span>
        </div>
        <div className="w-full bg-[#E5E5E1] h-1 rounded-full overflow-hidden">
          <div
            className="bg-[#1A1A1A] h-full transition-all duration-300"
            style={{ width: `${capacityPercent}%` }}
          />
        </div>
        <p className="text-[10px] uppercase tracking-wider text-[#A3A39F] mt-2 font-bold">
          {data.buildings.length} Buildings • {data.rooms.length} Rooms
        </p>
      </div>

      {/* Footer / Active Persona */}
      <div className="p-6 border-t border-[#E5E5E1]">
        <div className="flex items-center justify-between bg-[#F9F9F8] p-2.5 border border-[#E5E5E1]">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#1A1A1A] text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#1A1A1A] truncate">{currentUser.name}</div>
              <div className="text-[9px] text-[#A3A39F] uppercase tracking-wider font-bold truncate">
                {currentUser.role}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

