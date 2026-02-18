export function RoleManagementTab() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Role Management</h2>
      <RoleManagement />
    </div>
  );
}

import React, { useState } from 'react';
import { userApi, type UserSearchResult } from '../../services/api';
import { useMutation } from '@tanstack/react-query';

function RoleManagement(): React.ReactElement {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const changeRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => userApi.changeUserRole(id, role),
  });

  const handleSearch = async () => {
    if (!query || query.length < 2) return;
    try {
      const res = await userApi.searchUsers(query);
      setResults(res);
    } catch (e) {
      console.error('Search failed', e);
    }
  };

  const handleChangeRole = async (userId: number, role: string) => {
    try {
      await changeRoleMutation.mutateAsync({ id: userId, role });
      // optimistic update not implemented; re-run search
      await handleSearch();
    } catch (e) {
      console.error('Change role failed', e);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Role Management</h2>
      <div className="flex gap-2 mb-4">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users by email or name" className="flex-1 px-3 py-2 border rounded" />
        <button onClick={handleSearch} className="px-4 py-2 bg-primary-red text-white rounded">Search</button>
      </div>

      <div className="space-y-2">
        {results.map(u => (
          <div key={u.user_id} className="flex items-center justify-between bg-white p-3 border rounded">
            <div>
              <div className="font-medium">{u.first_name} {u.last_name}</div>
              <div className="text-sm text-gray-500">{u.email}</div>
            </div>
            <div className="flex items-center gap-2">
              <select defaultValue={"USER"} onChange={(e) => handleChangeRole(u.user_id, e.target.value)} className="px-3 py-2 border rounded">
                <option value="USER">USER</option>
                <option value="BUSINESS_OWNER">BUSINESS_OWNER</option>
                <option value="TRAVEL_AGENCY">TRAVEL_AGENCY</option>
                <option value="LGU_ADMIN">LGU_ADMIN</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
