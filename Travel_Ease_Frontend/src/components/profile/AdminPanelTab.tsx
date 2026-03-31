import React, { useState, useEffect } from 'react';
import { userApi, trafficApi, type AuthUser } from '../../services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export function AdminPanelTab() {
    return (
        <div className="p-6">
            <div className="space-y-6">
                <TrafficManagement />
                <UserManagement />
            </div>
        </div>
    );
}

function TrafficManagement() {
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const generateSnapshots = useMutation({
        mutationFn: () => trafficApi.generateSnapshots(),
        onSuccess: (data) => {
            setSuccessMsg(data.message || 'Traffic snapshots successfully generated.');
            setErrorMsg('');
            setTimeout(() => setSuccessMsg(''), 5000);
        },
        onError: (err: any) => {
            setErrorMsg(err?.response?.data?.error || 'Failed to generate snapshots.');
            setSuccessMsg('');
        },
    });

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">System Operations</h3>
                    <p className="text-sm text-gray-500 mt-1">Manage core system data and external integrations.</p>
                </div>
            </div>
            <div className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div>
                        <h4 className="font-medium text-gray-900">Zone Traffic Snapshots</h4>
                        <p className="text-sm text-gray-500 mt-1">
                            Recalculate and cache all OSRM routing metrics between Tagaytay zones.
                            Required if map nodes or base traffic multipliers are altered.
                        </p>
                    </div>
                    <button
                        onClick={() => generateSnapshots.mutate()}
                        disabled={generateSnapshots.isPending}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-red text-white disabled:bg-red-300 rounded-md shadow-sm hover:bg-red-700 transition-colors whitespace-nowrap"
                    >
                        {generateSnapshots.isPending ? (
                            <span className="flex items-center gap-2">
                                <RefreshCw className="animate-spin" /> Generating...
                            </span>
                        ) : (
                            'Generate Snapshots'
                        )}
                    </button>
                </div>

                {successMsg && (
                    <div className="mt-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm">
                        {successMsg}
                    </div>
                )}
                {errorMsg && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
                        {errorMsg}
                    </div>
                )}
            </div>
        </div>
    );
}

function UserManagement() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const limit = 5;

    // Fetch paginated users
    const { data, isLoading, isError } = useQuery({
        queryKey: ['admin-users', page, limit, search],
        queryFn: () => userApi.getAllUsers(page, limit, search),
        placeholderData: (previousData) => previousData, // keep old data while fetching
    });

    const changeRoleMutation = useMutation({
        mutationFn: ({ id, role }: { id: number; role: string }) => userApi.changeUserRole(id, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        }
    });

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(1); // Reset to page 1 on search
    };

    const handleClearSearch = () => {
        setSearchInput('');
        setSearch('');
        setPage(1);
    };

    const handleChangeRole = async (userId: number, role: string) => {
        if (window.confirm(`Are you sure you want to change this user's role to ${role}?`)) {
            try {
                await changeRoleMutation.mutateAsync({ id: userId, role });
            } catch (e: any) {
                alert(e?.response?.data?.error || 'Failed to update role.');
            }
        }
    };

    const totalPages = data?.pagination?.totalPages || 1;
    const users = data?.users || [];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">User Role Management</h3>
                    <p className="text-sm text-gray-500 mt-1">Manage roles and permissions for all registered accounts.</p>
                </div>
            </div>

            <div className="p-5">
                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search by name or email..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-red focus:border-primary-red"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
                    >
                        Search
                    </button>
                    {search && (
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </form>

                {/* User Table/List */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-6 text-center text-gray-500">
                                            <div className="flex justify-center items-center gap-2">
                                                <RefreshCw className="animate-spin text-primary-red" />
                                                Loading users...
                                            </div>
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-6 text-center text-gray-500">
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((u: any) => (
                                        <tr key={u.user_id}>
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                                                        {u.first_name ? u.first_name.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {u.first_name} {u.last_name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                                                {u.contact_no || <span className="text-gray-400 italic">Not provided</span>}
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' : ''}
                          ${u.role === 'LGU_ADMIN' ? 'bg-blue-100 text-blue-800' : ''}
                          ${u.role === 'TRAVEL_AGENCY' ? 'bg-green-100 text-green-800' : ''}
                          ${u.role === 'BUSINESS_OWNER' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${u.role === 'USER' ? 'bg-gray-100 text-gray-800' : ''}
                        `}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                                                <select
                                                    value={u.role}
                                                    onChange={(e) => handleChangeRole(u.user_id, e.target.value)}
                                                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-primary-red focus:border-primary-red font-medium text-gray-700 disabled:bg-gray-100 disabled:text-gray-400"
                                                    disabled={changeRoleMutation.isPending && changeRoleMutation.variables?.id === u.user_id}
                                                >
                                                    <option value="USER">USER</option>
                                                    <option value="BUSINESS_OWNER">BUSINESS_OWNER</option>
                                                    <option value="TRAVEL_AGENCY">TRAVEL_AGENCY</option>
                                                    <option value="LGU_ADMIN">LGU_ADMIN</option>
                                                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                            <span className="text-sm text-gray-700">
                                Showing page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                                {' '}({data?.pagination?.total || 0} total users)
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1 || isLoading}
                                    className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                    title="Previous Page"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages || isLoading}
                                    className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                    title="Next Page"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
