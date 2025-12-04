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
import type { Participant } from "../../utils/travel_plan/fetch_participants";

interface CollaboratorsProps {
  planId: string;
  isOwner: boolean;
  on_close: () => void;
}

export default function Collaborators({
  planId,
  isOwner,
  on_close,
}: CollaboratorsProps): React.ReactElement {
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  // Email search state
  const [emailSearch, setEmailSearch] = useState<string>("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [showCopyLinkModal, setShowCopyLinkModal] = useState<boolean>(false);

  // Debounce the search query
  const debouncedSearch = useDebouncedValue(emailSearch, 300);

  // Use TanStack Query for fetching participants
  const {
    data: participants = [],
    isLoading: loading,
    isError,
    error: queryError,
    refetch,
  } = useTravelPlanParticipants(planId);

  const error = isError ? (queryError?.message || "Failed to load collaborators") : null;

  // Use TanStack Query mutations for participant management
  const removeParticipantMutation = useRemoveParticipant();
  const updateRoleMutation = useUpdateParticipantRole();
  const approveParticipantMutation = useApproveParticipant();
  const addParticipantMutation = useAddParticipant();

  // Search for users when debounced search changes
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
        // Filter out users already in participants
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

  // Add a collaborator
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

  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case "Admin":
        return "bg-red-100 text-red-800";
      case "Editor":
        return "bg-blue-100 text-blue-800";
      case "Viewer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadge = (status: boolean): React.ReactElement => {
    if (status) {
      return (
        <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
          Approved
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">
        Pending
      </span>
    );
  };

  // Separate approved and pending participants
  const approvedParticipants = participants.filter((p) => p.status);
  const pendingParticipants = participants.filter((p) => !p.status);

  return (
    <div className="modal">
      <div className="modal_body max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold text-red-600">Collaborators</h1>
          <button
            onClick={on_close}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Invite Section - Only for owners */}
        {isOwner && (
          <div className="mb-4 pb-4 border-b">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invite Collaborators
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {addParticipantMutation.isPending ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : "✉️"}
              </span>
              <input
                type="text"
                value={addParticipantMutation.isPending ? "" : emailSearch}
                onChange={(e) => setEmailSearch(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder={addParticipantMutation.isPending ? "Adding collaborator..." : "Search by email..."}
                disabled={addParticipantMutation.isPending}
                className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none ${
                  addParticipantMutation.isPending ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              />
              {isSearching && !addParticipantMutation.isPending && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </span>
              )}

              {/* Dropdown with search results */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.user_id}
                      type="button"
                      onClick={() => handleAddCollaborator(user)}
                      disabled={addParticipantMutation.isPending}
                      className="w-full px-4 py-2 text-left hover:bg-red-50 transition-colors border-b border-gray-100 last:border-b-0 disabled:opacity-50"
                    >
                      <div className="font-medium text-gray-800">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Copy Link Button */}
            <button
              onClick={() => setShowCopyLinkModal(true)}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy Invite Link
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
            <button onClick={() => refetch()} className="soft_btn mt-2">
              Retry
            </button>
          </div>
        ) : participants.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No collaborators yet</p>
            <p className="text-sm mt-2">
              Share this plan to invite collaborators
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* Approved Participants */}
            {approvedParticipants.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Members ({approvedParticipants.length})
                </h3>
                <div className="space-y-2">
                  {approvedParticipants.map((participant) => (
                    <div
                      key={participant.participant_id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-medium">
                          {participant.user?.first_name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {participant.user?.first_name}{" "}
                            {participant.user?.last_name}
                          </p>
                          {participant.user?.email && (
                            <p className="text-xs text-gray-500">
                              {participant.user.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOwner && participant.role !== "Admin" ? (
                          <select
                            value={participant.role}
                            onChange={(e) =>
                              handleRoleChange(
                                participant.user_id,
                                e.target.value as "Admin" | "Editor" | "Viewer"
                              )
                            }
                            disabled={actionLoading === participant.user_id}
                            className="text-sm border rounded px-2 py-1"
                          >
                            <option value="Viewer">Viewer</option>
                            <option value="Editor">Editor</option>
                            <option value="Admin">Admin</option>
                          </select>
                        ) : (
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(
                              participant.role
                            )}`}
                          >
                            {participant.role}
                          </span>
                        )}
                        {isOwner && participant.role !== "Admin" && (
                          <button
                            onClick={() => handleRemove(participant.user_id)}
                            disabled={actionLoading === participant.user_id}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50"
                            title="Remove collaborator"
                          >
                            {actionLoading === participant.user_id ? (
                              <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                            ) : (
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
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

            {/* Pending Participants */}
            {pendingParticipants.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Pending Requests ({pendingParticipants.length})
                </h3>
                <div className="space-y-2">
                  {pendingParticipants.map((participant) => (
                    <div
                      key={participant.participant_id}
                      className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-medium">
                          {participant.user?.first_name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {participant.user?.first_name}{" "}
                            {participant.user?.last_name}
                          </p>
                          {getStatusBadge(participant.status)}
                        </div>
                      </div>
                      {isOwner && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(participant.user_id)}
                            disabled={actionLoading === participant.user_id}
                            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRemove(participant.user_id)}
                            disabled={actionLoading === participant.user_id}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                          >
                            Deny
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t mt-4">
          <button onClick={on_close} className="soft_btn">
            Close
          </button>
        </div>
      </div>

      {/* Copy Link Placeholder Modal */}
      {showCopyLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Coming Soon!
            </h3>
            <p className="text-gray-600 mb-4">
              The invite link feature is currently being developed. Check back soon!
            </p>
            <button
              onClick={() => setShowCopyLinkModal(false)}
              className="hard_btn w-full"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

