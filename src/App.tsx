import React from 'react';
import { PropertyProvider, useProperty } from './context/PropertyContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { RoomInventoryView } from './components/RoomInventoryView';
import { BedAssignmentsView } from './components/BedAssignmentsView';
import { PropertySettingsView } from './components/PropertySettingsView';
import { MaintenanceView } from './components/MaintenanceView';
import { UserManagementView } from './components/UserManagementView';
import { ReportsView } from './components/ReportsView';
import { LoginPage } from './components/LoginPage';

const MainContent: React.FC = () => {
  const { activeTab, isLoading } = useProperty();
  const { isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F9F9F8] text-[#1A1A1A] font-semibold text-sm">
        <div className="flex items-center gap-3 bg-white p-6 border border-[#E5E5E1] shadow-md">
          <div className="w-5 h-5 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
          <span className="text-base font-bold">Loading Housing & Accommodation System...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="flex min-h-screen bg-[#F9F9F8] text-[#1A1A1A] antialiased font-sans">
      {/* Side Navigation */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header />

        <main className="flex-1 p-8 pb-12 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && <DashboardView />}
          {(activeTab === 'inventory' || activeTab === 'settings') && <PropertySettingsView />}
          {activeTab === 'assignments' && <BedAssignmentsView />}
          {activeTab === 'maintenance' && <MaintenanceView />}
          {activeTab === 'users' && <UserManagementView />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'settings' && <PropertySettingsView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <PropertyProvider>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </PropertyProvider>
  );
}

