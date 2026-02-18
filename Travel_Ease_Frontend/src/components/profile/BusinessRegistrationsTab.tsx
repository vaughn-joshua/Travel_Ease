import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { businessApi } from '../../services/api';
import { useSetBusinessStatus } from '../../features/businesses/mutations';

export function BusinessRegistrationsTab() {
  const [page, setPage] = useState(1);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Fetch pending (unapproved) business registrations from admin endpoint
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'business-registrations', page],
    queryFn: () => businessApi.getPendingRegistrations(page),
    staleTime: 1000 * 30,
  });

  const setStatusMutation = useSetBusinessStatus();

  const pending = data?.data || [];
  const pagination = data?.pagination;

  const handleApprove = async (id: number) => {
    try {
      await setStatusMutation.mutateAsync({ id, status: 'APPROVED' });
      refetch();
    } catch (e: any) {
      const errorMsg = e?.response?.data?.error || e?.message || 'Failed to approve business';
      console.error('Approve failed', e);
      alert(`Error: ${errorMsg}`);
    }
  };

  const handleReject = async (id: number, reason: string) => {
    try {
      await setStatusMutation.mutateAsync({ 
        id, 
        status: 'REJECTED',
        rejection_reason: reason || 'Rejected by admin'
      });
      setRejectingId(null);
      setRejectionReason('');
      refetch();
    } catch (e: any) {
      const errorMsg = e?.response?.data?.error || e?.message || 'Failed to reject business';
      console.error('Reject failed', e);
      alert(`Error: ${errorMsg}`);
    }
  };

  if (isLoading) return <div className="p-6">Loading pending registrations…</div>;
  if (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    const is403 = (error as any)?.response?.status === 403;
    const errorDetail = (error as any)?.response?.data?.message || (error as any)?.response?.data?.error || errorMsg;
    
    console.error('Failed to fetch pending registrations:', { error, status: (error as any)?.response?.status, detail: errorDetail });
    
    return (
      <div className="p-6">
        <div className="text-red-600">
          <p className="font-semibold mb-2">Failed to load pending registrations</p>
          <p className="text-sm mb-2">
            {is403 
              ? "You don't have permission to view pending registrations. Make sure your account has an admin role (SUPER_ADMIN or LGU_ADMIN) set in the database."
              : `Error: ${errorDetail}`
            }
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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Registrations (Pending)</h2>
      {pending.length === 0 ? (
        <div className="text-gray-600">No pending business registrations.</div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {pending.map((b: any) => (
              <div key={b.business_id || b.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{b.name}</h3>
                  <p className="text-sm text-gray-500">{b.city} • {b.brgy ?? ''}</p>
                  {b.description && <p className="text-sm text-gray-600 line-clamp-2">{b.description}</p>}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleApprove(b.business_id ?? b.id)}
                    disabled={setStatusMutation.isPending}
                    className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {setStatusMutation.isPending ? '...' : 'Approve'}
                  </button>
                  <button 
                    onClick={() => setRejectingId(b.business_id ?? b.id)}
                    disabled={setStatusMutation.isPending}
                    className="px-3 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
                {rejectingId === (b.business_id ?? b.id) && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                      <p className="font-semibold mb-3">Reject "{b.name}"?</p>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Enter reason for rejection (optional)"
                        className="w-full p-2 border rounded mb-4 text-sm"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setRejectingId(null); setRejectionReason(''); }}
                          className="flex-1 px-3 py-2 border rounded hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReject(b.business_id ?? b.id, rejectionReason)}
                          disabled={setStatusMutation.isPending}
                          className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          {setStatusMutation.isPending ? '...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-3 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}


export default BusinessRegistrationsTab;
