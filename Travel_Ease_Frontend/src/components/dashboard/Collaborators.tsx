import React, { useState, useEffect } from "react";
import { useTravelPlanParticipants } from "../../features/travelPlans/queries";
import {
  useRemoveParticipant,
  useUpdateParticipantRole,
  useApproveParticipant,
  useAddParticipant,
} from "../../features/travelPlans/mutations";
import { userApi, type UserSearchResult } from "../../services/api";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useAuth } from "../../context/AuthContext";
import type { Participant } from "../../utils/travel_plan/fetch_participants";
import { RoleBadge } from "../ui/PlanCard";

interface CollaboratorsProps {
  planId: string;
  userRole: "owner" | "Admin" | "Editor" | "Viewer" | null;
  canDelete: boolean;
  canInvite: boolean;
  canEditRoles: boolean;
  on_close: () => void;
}

export default function Collaborators({
  planId,
  userRole,
  canDelete,
  canInvite,
  canEditRoles,
  on_close,
}: CollaboratorsProps): React.ReactElement {
  const { user } = useAuth();
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  
  const [emailSearch, setEmailSearch] = useState<string>("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [showCopyLinkModal, setShowCopyLinkModal] = useState<boolean>(false);

  const debouncedSearch = useDebouncedValue(emailSearch, 300);

  const {
    data: participants = [],
    isLoading: loading,
    isError,
    error: queryError,
    refetch,
  } = useTravelPlanParticipants(planId);

  const error = isError ? (queryError?.message || "Failed to load collaborators") : null;

  const removeParticipantMutation = useRemoveParticipant();
  const updateRoleMutation = useUpdateParticipantRole();
  const approveParticipantMutation = useApproveParticipant();
  const addParticipantMutation = useAddParticipant();

  const isOwner = userRole === "owner";

  useEffect(() => {
    const searchUsers = async () => {
      if (debouncedSearch.length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await userApi.searchUsers(debouncedSearch);
        const existingUserIds = participants.map((p) => p.user_id);
        const filtered = results.filter(
          (user) => !existingUserIds.includes(user.user_id)
        );
        setSearchResults(filtered);
        setShowDropdown(filtered.length > 0);
      } catch (error) {
        console.error("Error searching users:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    searchUsers();
  }, [debouncedSearch, participants]);

  const handleAddCollaborator = (user: UserSearchResult) => {
    addParticipantMutation.mutate(
      { planId, userId: user.user_id, role: "Viewer" },
      {
        onSuccess: () => {
          setEmailSearch("");
          setSearchResults([]);
          setShowDropdown(false);
          refetch();
        },
        onError: (err) => {
          alert(err instanceof Error ? err.message : "Failed to add collaborator");
        },
      }
    );
  };

  const handleRemove = async (userId: number): Promise<void> => {
    if (!confirm("Are you sure you want to remove this collaborator?")) return;

    setActionLoading(userId);
    removeParticipantMutation.mutate(
      { planId, userId },
      {
        onSuccess: () => {
          refetch();
          setActionLoading(null);
        },
        onError: (err) => {
          alert(err instanceof Error ? err.message : "Failed to remove collaborator");
          setActionLoading(null);
        },
      }
    );
  };

  const handleRoleChange = async (
    userId: number,
    newRole: "Admin" | "Editor" | "Viewer"
  ): Promise<void> => {
    setActionLoading(userId);
    updateRoleMutation.mutate(
      { planId, userId, role: newRole },
      {
        onSuccess: () => {
          refetch();
          setActionLoading(null);
        },
        onError: (err) => {
          alert(err instanceof Error ? err.message : "Failed to update role");
          setActionLoading(null);
        },
      }
    );
  };

  const handleApprove = async (userId: number): Promise<void> => {
    setActionLoading(userId);
    approveParticipantMutation.mutate(
      { planId, userId },
      {
        onSuccess: () => {
          refetch();
          setActionLoading(null);
        },
        onError: (err) => {
          alert(err instanceof Error ? err.message : "Failed to approve participant");
          setActionLoading(null);
        },
      }
    );
  };

  const handleLeave = async (): Promise<void> => {
    if (!user?.id) return;
    if (!confirm("Are you sure you want to leave this plan?")) return;

    setIsLeaving(true);
    removeParticipantMutation.mutate(
      { planId, userId: user.id },
      {
        onSuccess: () => {
          setIsLeaving(false);
          on_close();
        },
        onError: (err) => {
          alert(err instanceof Error ? err.message : "Failed to leave plan");
          setIsLeaving(false);
        },
      }
    );
  };

  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case "Admin":
        return "bg-red-50 text-red-700 border-red-200";
      case "Editor":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Viewer":
        return "bg-gray-100 text-gray-600 border-gray-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const approvedParticipants = participants.filter((p) => p.status);
  const pendingParticipants = participants
    .filter((p) => !p.status)
    .sort((a, b) => {
      if (!a.joined_at || !b.joined_at) return 0;
      return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
    });

  return (
    <div className="fixed inset-0 z-[1500] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Collaborators</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {approvedParticipants.length} member{approvedParticipants.length !== 1 ? "s" : ""}
                {pendingParticipants.length > 0 && ` • ${pendingParticipants.length} pending`}
              </p>
            </div>
            <button
              onClick={on_close}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Invite Section */}
        {canInvite && (
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invite by email
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                {addParticipantMutation.isPending ? (
                  <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </div>
              <input
                type="text"
                value={addParticipantMutation.isPending ? "" : emailSearch}
                onChange={(e) => setEmailSearch(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder={addParticipantMutation.isPending ? "Adding..." : "Search by email..."}
                disabled={addParticipantMutation.isPending}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-red focus:border-transparent outline-none transition-all disabled:bg-gray-100"
              />
              {isSearching && !addParticipantMutation.isPending && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              )}

              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.user_id}
                      type="button"
                      onClick={() => handleAddCollaborator(user)}
                      disabled={addParticipantMutation.isPending}
                      className="w-full px-4 py-3 text-left hover:bg-primary-red/5 transition-colors border-b border-gray-100 last:border-b-0 disabled:opacity-50"
                    >
                      <div className="font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowCopyLinkModal(true)}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-white hover:border-gray-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Copy Invite Link
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-red"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-red-600 font-medium">{error}</p>
              <button onClick={() => refetch()} className="mt-2 text-sm text-primary-red hover:underline">
                Retry
              </button>
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">No collaborators yet</p>
              <p className="text-sm text-gray-400 mt-1">Invite people to collaborate on this plan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Approved members */}
              {approvedParticipants.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Members ({approvedParticipants.length})
                  </h3>
                  <div className="space-y-2">
                    {approvedParticipants.map((participant) => (
                      <div
                        key={participant.participant_id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-red to-red-400 flex items-center justify-center text-white font-semibold shrink-0">
                          {participant.user?.first_name?.charAt(0) || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {participant.user?.first_name} {participant.user?.last_name}
                          </p>
                          {participant.user?.email && (
                            <p className="text-xs text-gray-500 truncate">{participant.user.email}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {canEditRoles ? (
                            <select
                              value={participant.role}
                              onChange={(e) =>
                                handleRoleChange(
                                  participant.user_id,
                                  e.target.value as "Admin" | "Editor" | "Viewer"
                                )
                              }
                              disabled={actionLoading === participant.user_id}
                              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-primary-red focus:border-transparent outline-none"
                            >
                              <option value="Viewer">Viewer</option>
                              <option value="Editor">Editor</option>
                              <option value="Admin">Admin</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(participant.role)}`}>
                              {participant.role}
                            </span>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleRemove(participant.user_id)}
                              disabled={actionLoading === participant.user_id}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Remove"
                            >
                              {actionLoading === participant.user_id ? (
                                <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending requests */}
              {pendingParticipants.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">
                    Pending ({pendingParticipants.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingParticipants.map((participant) => {
                      const hasOtherApprovedParticipants = approvedParticipants.length >= 2;
                      const showApproveDeny = canEditRoles && hasOtherApprovedParticipants;
                      
                      return (
                        <div
                          key={participant.participant_id}
                          className="flex items-center gap-3 p-3 bg-amber-50/50 border border-amber-200/50 rounded-xl"
                        >
                          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-semibold shrink-0">
                            {participant.user?.first_name?.charAt(0) || "U"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {participant.user?.first_name} {participant.user?.last_name}
                            </p>
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Pending approval
                            </span>
                            {!showApproveDeny && (
                              <p className="text-xs text-gray-400 mt-0.5">Waiting for more members</p>
                            )}
                          </div>
                          {showApproveDeny && (
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => handleApprove(participant.user_id)}
                                disabled={actionLoading === participant.user_id}
                                className="px-3 py-1.5 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRemove(participant.user_id)}
                                disabled={actionLoading === participant.user_id}
                                className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                              >
                                Deny
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-between">
          {!isOwner && user?.id && participants.some(p => p.user_id === user.id) ? (
            <button
              onClick={handleLeave}
              disabled={isLeaving}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {isLeaving ? "Leaving..." : "Leave Plan"}
            </button>
          ) : (
            <div></div>
          )}
          <button 
            onClick={on_close} 
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-white transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>

      {/* Copy Link Modal */}
      {showCopyLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 text-center animate-fade-in">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Coming Soon!
            </h3>
            <p className="text-gray-600 mb-6">
              The invite link feature is currently being developed.
            </p>
            <button
              onClick={() => setShowCopyLinkModal(false)}
              className="w-full py-2.5 bg-primary-red text-white rounded-xl hover:bg-primary-red-dark transition-colors font-medium"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
