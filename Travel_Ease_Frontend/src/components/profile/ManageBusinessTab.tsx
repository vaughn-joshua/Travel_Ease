import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyBusinesses } from '../../features/businesses/queries';
import { useDeleteBusiness } from '../../features/businesses/mutations';

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

  const businesses: BusinessRow[] = businessesData?.data || [];

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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manage Business</h2>
        <button onClick={() => navigate('/businesses/onboarding')} className="btn-primary">+ Add Business</button>
      </div>

      {businesses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">You don't have any businesses yet.</p>
          <button onClick={() => navigate('/businesses/onboarding')} className="px-6 py-2 bg-primary-red text-white rounded-lg hover:bg-red-700 transition-colors">Register a Business</button>
        </div>
      ) : (
        <div className="space-y-4">
          {businesses.map(b => (
            <div key={b.business_id} className="bg-white border rounded-lg p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-14 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                  {b.picture ? <img src={b.picture as string} alt={b.name} className="w-full h-full object-cover" /> : (
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                    </svg>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{b.name}</h3>
                  <p className="text-sm text-gray-500">{b.city} • <span className="font-medium">{b.status ? 'Active' : 'Pending'}</span></p>
                  {b.description && <p className="text-sm text-gray-600 line-clamp-2">{b.description}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setViewing(b)} className="px-3 py-2 text-sm border rounded-lg">View</button>
                <button onClick={() => navigate(`/businesses/${b.business_id}/edit`)} className="px-3 py-2 text-sm bg-primary-red text-white rounded-lg">Edit</button>
                <button onClick={() => handleDelete(b.business_id)} className="px-3 py-2 text-sm border text-red-600 rounded-lg">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View modal */}
      {viewing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-xl w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-semibold">{viewing.name}</h3>
              <button onClick={() => setViewing(null)} className="text-gray-500">Close</button>
            </div>
            <p className="text-sm text-gray-600 mb-4">{viewing.description}</p>
            <p className="text-sm text-gray-500">Location: {viewing.city}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setViewing(null)} className="px-4 py-2 border rounded">Close</button>
              <button onClick={() => { navigate(`/businesses/${viewing.business_id}`); setViewing(null); }} className="px-4 py-2 bg-primary-red text-white rounded">Open</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Delete business?</h3>
            <p className="text-sm text-gray-600 mb-4">This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={() => confirmDelete(confirmDeleteId)} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
