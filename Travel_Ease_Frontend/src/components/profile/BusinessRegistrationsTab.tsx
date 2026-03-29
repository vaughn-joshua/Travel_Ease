import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { businessApi } from "../../services/api";
import { useSetBusinessStatus } from "../../features/businesses/mutations";

export function BusinessRegistrationsTab() {
  const [page, setPage] = useState(1);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch pending (unapproved) business registrations from admin endpoint
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "business-registrations", page],
    queryFn: () => businessApi.getPendingRegistrations(page),
    staleTime: 1000 * 30,
  });

  const setStatusMutation = useSetBusinessStatus();

  const pending = data?.data || [];
  const pagination = data?.pagination;

  const handleApprove = async (id: number) => {
    try {
      await setStatusMutation.mutateAsync({ id, status: "APPROVED" });
      refetch();
    } catch (e: any) {
      const errorMsg =
        e?.response?.data?.error || e?.message || "Failed to approve business";
      console.error("Approve failed", e);
      alert(`Error: ${errorMsg}`);
    }
  };

  const handleReject = async (id: number, reason: string) => {
    try {
      await setStatusMutation.mutateAsync({
        id,
        status: "REJECTED",
        rejection_reason: reason || "Rejected by admin",
      });
      setRejectingId(null);
      setRejectionReason("");
      refetch();
    } catch (e: any) {
      const errorMsg =
        e?.response?.data?.error || e?.message || "Failed to reject business";
      console.error("Reject failed", e);
      alert(`Error: ${errorMsg}`);
    }
  };

  if (isLoading)
    return <div className="p-6">Loading pending registrations…</div>;
  if (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    const is403 = (error as any)?.response?.status === 403;
    const errorDetail =
      (error as any)?.response?.data?.message ||
      (error as any)?.response?.data?.error ||
      errorMsg;

    console.error("Failed to fetch pending registrations:", {
      error,
      status: (error as any)?.response?.status,
      detail: errorDetail,
    });

    return (
      <div className="p-6">
        <div className="text-red-600">
          <p className="font-semibold mb-2">
            Failed to load pending registrations
          </p>
          <p className="text-sm mb-2">
            {is403
              ? "You don't have permission to view pending registrations. Make sure your account has an admin role (SUPER_ADMIN or LGU_ADMIN) set in the database."
              : `Error: ${errorDetail}`}
          </p>
          <button
            onClick={() => refetch()}
            className="text-sm text-blue-600 hover:underline mt-2"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Business Registrations Card */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Business Registrations
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage pending business registrations.
            </p>
          </div>
        </div>

        <div className="p-6">
          {pending.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No pending business registrations
            </div>
          ) : (
            <>
              {/* Business Registrations Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Business Name
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Location
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pending.map((b: any) => (
                        <tr
                          key={b.business_id || b.id}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {b.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {b.city}, {b.brgy ?? "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                              Pending
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleApprove(b.business_id ?? b.id)
                                }
                                disabled={setStatusMutation.isPending}
                                className="px-3 py-1 bg-green-600 text-white rounded-md text-xs hover:bg-green-700 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  setRejectingId(b.business_id ?? b.id)
                                }
                                disabled={setStatusMutation.isPending}
                                className="px-3 py-1 border border-red-300 text-red-600 rounded-md text-xs hover:bg-red-50 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      Showing page{" "}
                      <span className="font-medium">{pagination.page}</span> of{" "}
                      <span className="font-medium">
                        {pagination.totalPages}
                      </span>
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        ←
                      </button>
                      <button
                        onClick={() =>
                          setPage((p) => Math.min(pagination.totalPages, p + 1))
                        }
                        disabled={page === pagination.totalPages}
                        className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <p className="font-semibold mb-3">Reject Business?</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection (optional)"
              className="w-full p-2 border rounded mb-4 text-sm"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setRejectingId(null);
                  setRejectionReason("");
                }}
                className="flex-1 px-3 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectingId, rejectionReason)}
                disabled={setStatusMutation.isPending}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {setStatusMutation.isPending ? "..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BusinessRegistrationsTab;
