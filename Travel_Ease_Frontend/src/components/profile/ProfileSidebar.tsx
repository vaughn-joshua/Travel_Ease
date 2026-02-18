import React from 'react';
import { useAuth } from '../../context/AuthContext';

export interface ProfileTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  visible: boolean;
  isSignOut?: boolean;
}

interface ProfileSidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function ProfileSidebar({ activeTab, onTabChange }: ProfileSidebarProps) {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  // Determine which tabs to show based on role
  const tabs: ProfileTab[] = [
    { id: 'account', label: 'Account Details', visible: true },
    { id: 'notifications', label: 'Notifications', visible: true },
    { id: 'manage-business', label: 'Manage Business', visible: true },
  ];

  // Admin tabs - only show to SUPER_ADMIN and LGU_ADMIN
  if (user?.role === 'SUPER_ADMIN' || user?.role === 'LGU_ADMIN') {
    tabs.push({ id: 'business-registrations', label: 'Business Registrations', visible: true });
  }

  // Role Management - only SUPER_ADMIN
  if (user?.role === 'SUPER_ADMIN') {
    tabs.push({ id: 'role-management', label: 'Role Management', visible: true });
  }

  // Favorites - all roles
  tabs.push({ id: 'favorites', label: 'Favorites', visible: true });

  const visibleTabs = tabs.filter(t => t.visible);

  return (
    <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex md:flex-col">
      {/* Mobile horizontal scroll */}
      <div className="md:hidden overflow-x-auto flex items-center gap-2 p-2">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-red text-primary-red'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
        {/* Mobile Sign Out */}
        <button
          onClick={handleSignOut}
          className="flex-shrink-0 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md"
        >
          Sign Out
        </button>
      </div>

      {/* Desktop vertical layout */}
      <div className="hidden md:flex md:flex-col md:h-screen md:w-64">
        <nav className="flex-1 p-4 space-y-1">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-red-50 text-primary-red border-l-4 border-primary-red'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Sign Out Button at bottom */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 bg-red-50 text-primary-red rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
