import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProfileSidebar } from '../components/profile/ProfileSidebar';
import { AccountDetailsTab } from '../components/profile/AccountDetailsTab';
import { NotificationsTab } from '../components/profile/NotificationsTab';
import { ManageBusinessTab } from '../components/profile/ManageBusinessTab';
import { BusinessRegistrationsTab } from '../components/profile/BusinessRegistrationsTab';
import { RoleManagementTab } from '../components/profile/RoleManagementTab';
import { FavoritesTab } from '../components/profile/FavoritesTab';

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('account');

  if (!loading && !user) {
    navigate('/login');
    return null;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return <AccountDetailsTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'manage-business':
        return <ManageBusinessTab />;
      case 'business-registrations':
        return <BusinessRegistrationsTab />;
      case 'role-management':
        return <RoleManagementTab />;
      case 'favorites':
        return <FavoritesTab />;
      default:
        return <AccountDetailsTab />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-red"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col md:flex-row">
        <ProfileSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
