import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMyBusinesses } from "../../features/businesses/queries";
import { useDeleteBusiness } from "../../features/businesses/mutations";

interface BusinessRow {
  business_id: number;
  name: string;
  description?: string;
  city?: string;
  status: boolean;
  picture?: string | null;
}

export function ManageBusinessTab() {
  const navigate = useNavigate();
  const { data: businessesData, isLoading, refetch } = useMyBusinesses();
  const deleteMutation = useDeleteBusiness();
  const [viewing, setViewing] = useState<BusinessRow | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const businesses: BusinessRow[] = businessesData?.data || [];
  const itemsPerPage = 7; // Responsive: 7-8 per page
  const totalPages = Math.ceil(businesses.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedBusinesses = businesses.slice(
    startIdx,
    startIdx + itemsPerPage,
  );

  const handleDelete = (id: number) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async (id: number) => {
    await deleteMutation.mutateAsync(id);
    setConfirmDeleteId(null);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-red" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Manage Business Card */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Manage Businesses
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              View and manage your registered businesses.
            </p>
          </div>
          <button
            onClick={() => navigate("/businesses/onboarding")}
            className="px-4 py-2 bg-primary-red text-white rounded-lg hover:bg-red-700 font-medium text-sm"
          >
            + Add
          </button>
        </div>

        <div className="p-6">
          {businesses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No businesses to manage
            </div>
          ) : (
            <>
              {/* Businesses Table */}
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
                      {paginatedBusinesses.map((b) => (
                        <tr key={b.business_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {b.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {b.city || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                b.status
                                  ? "bg-green-100 text-green-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {b.status ? "Active" : "Pending"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setViewing(b)}
                                className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md text-xs hover:bg-gray-50"
                              >
                                View
                              </button>
                              <button
                                onClick={() =>
                                  navigate(`/businesses/${b.business_id}/edit`)
                                }
                                className="px-3 py-1 border border-blue-300 text-blue-700 rounded-md text-xs hover:bg-blue-50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(b.business_id)}
                                className="px-3 py-1 border border-red-300 text-red-700 rounded-md text-xs hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      Showing page{" "}
                      <span className="font-medium">{currentPage}</span> of{" "}
                      <span className="font-medium">{totalPages}</span> (
                      {businesses.length} total)
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        ←
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
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

      {/* View modal */}
      {viewing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-xl w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-semibold">{viewing.name}</h3>
              <button
                onClick={() => setViewing(null)}
                className="text-gray-500"
              >
                Close
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">{viewing.description}</p>
            <p className="text-sm text-gray-500">Location: {viewing.city}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setViewing(null)}
                className="px-4 py-2 border rounded"
              >
                Close
              </button>
              <button
                onClick={() => {
                  navigate(`/businesses/${viewing.business_id}`);
                  setViewing(null);
                }}
                className="px-4 py-2 bg-primary-red text-white rounded"
              >
                Open
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Delete business?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(confirmDeleteId)}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
