import React, { useState } from 'react';
import { useProperty } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';
import {
  BedDouble,
  Building,
  DoorClosed,
  Wrench,
  Plus,
  Clock,
  CheckCircle2,
  Users,
  AlertTriangle,
  Phone,
  UserCheck,
} from 'lucide-react';
import { CreateMaintenanceModal } from './modals/CreateMaintenanceModal';

export const TenantPortalView: React.FC = () => {
  const { data } = useProperty();
  const { currentUser } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Find tenant bed assignment
  const tenantBedId = currentUser.assignedBedId || 'bed-101-1';
  const tenantBed = (data.beds || []).find((b) => b.id === tenantBedId);
  const tenantRoom = (data.rooms || []).find((r) => r.id === tenantBed?.roomId);
  const tenantBuilding = (data.buildings || []).find((b) => b.id === tenantRoom?.buildingId);
  const tenantFloor = (data.floors || []).find((f) => f.id === tenantRoom?.floorId);

  // Find roommates in same room
  const roomBeds = (data.beds || []).filter((b) => b.roomId === tenantRoom?.id);
  const roommates = roomBeds
    .filter((b) => b.id !== tenantBedId && b.assignedTo)
    .map((b) => b.assignedTo!);

  // Find maintenance tickets for this tenant or this room
  const myTickets = (data.maintenanceRequests || []).filter(
    (req) => req.requesterId === currentUser.id || (tenantRoom && req.roomId === tenantRoom.id)
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E5E1] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A3A39F]">
              Resident Housing Dashboard
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mt-0.5">
            Welcome, {currentUser.name}
          </h1>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#333330] text-white font-bold text-[10px] uppercase tracking-widest transition-colors shadow-xs self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Report Repair / Maintenance</span>
        </button>
      </div>

      {/* Residence Overview Card */}
      <div className="bg-white border border-[#E5E5E1] p-6 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E5E1] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1A1A1A] text-white flex items-center justify-center">
              <BedDouble className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#A3A39F] uppercase tracking-wider block">
                Assigned Residence
              </span>
              <h2 className="text-xl font-bold text-[#1A1A1A]">
                {tenantBuilding?.name || 'Horizon Tower A'} &bull; Room #{tenantRoom?.roomNumber || '101'}
              </h2>
            </div>
          </div>

          <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300">
            Occupied & Active
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-bold text-[#A3A39F] uppercase tracking-wider block">
              Building & Code
            </span>
            <span className="font-semibold text-[#1A1A1A]">
              {tenantBuilding?.name} ({tenantBuilding?.code})
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-[#A3A39F] uppercase tracking-wider block">
              Floor
            </span>
            <span className="font-semibold text-[#1A1A1A]">
              {tenantFloor?.label || 'Floor 1'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-[#A3A39F] uppercase tracking-wider block">
              Assigned Bed
            </span>
            <span className="font-semibold text-[#1A1A1A]">
              {tenantBed?.label || 'Bed A (Window Position)'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-[#A3A39F] uppercase tracking-wider block">
              Employee ID
            </span>
            <span className="font-semibold text-[#1A1A1A]">
              {currentUser.employeeId || 'EMP-8042'}
            </span>
          </div>
        </div>

        {/* Roommates Section */}
        <div className="pt-4 border-t border-[#E5E5E1]">
          <h3 className="text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#1A1A1A]" />
            <span>Roommates & Bed Occupants ({roommates.length})</span>
          </h3>

          {roommates.length === 0 ? (
            <p className="text-xs text-[#A3A39F]">No other occupants currently assigned to this room.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {roommates.map((m, idx) => (
                <div key={idx} className="p-3 bg-[#F9F9F8] border border-[#E5E5E1] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-[#1A1A1A]">{m.memberName}</span>
                    <span className="text-[10px] text-[#666662] block">{m.department} &bull; ID: {m.employeeId}</span>
                  </div>
                  {m.phone && (
                    <div className="flex items-center gap-1 text-[11px] text-[#1A1A1A] font-semibold">
                      <Phone className="w-3 h-3 text-[#A3A39F]" />
                      <span>{m.phone}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Maintenance Tickets Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#1A1A1A]" />
            <span>My Maintenance Requests & Room Issues</span>
          </h3>
          <span className="text-xs font-bold text-[#A3A39F]">{myTickets.length} Tickets Found</span>
        </div>

        {myTickets.length === 0 ? (
          <div className="bg-white p-8 border border-[#E5E5E1] text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-base text-[#1A1A1A]">No Open Maintenance Issues</h4>
            <p className="text-xs text-[#666662] max-w-md mx-auto">
              Your room and bed are currently in optimal condition. If anything breaks, click "Report Repair / Maintenance" above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myTickets.map((ticket) => (
              <div key={ticket.id} className="bg-white p-4 border border-[#E5E5E1] shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#1A1A1A] text-white">
                    {ticket.category}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border ${
                      ticket.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : ticket.status === 'In Progress'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {ticket.status}
                  </span>
                </div>

                <h4 className="font-bold text-base text-[#1A1A1A]">{ticket.title}</h4>
                <p className="text-xs text-[#666662] bg-[#F9F9F8] p-2 border border-[#E5E5E1]">"{ticket.description}"</p>

                <div className="pt-2 border-t border-[#E5E5E1] text-[10px] text-[#A3A39F] flex justify-between">
                  <span>Submitted: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                  {ticket.assignedTechnician ? (
                    <span className="font-bold text-emerald-800 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-emerald-600" />
                      Tech: {ticket.assignedTechnician}
                    </span>
                  ) : (
                    <span>Awaiting technician assignment</span>
                  )}
                </div>

                {ticket.resolutionNotes && (
                  <div className="bg-emerald-50 p-2 border border-emerald-200 text-[11px] text-emerald-900 font-medium">
                    <strong>Resolution Note:</strong> {ticket.resolutionNotes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateMaintenanceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        preselectedRoomId={tenantRoom?.id}
        preselectedBedId={tenantBedId}
      />
    </div>
  );
};
