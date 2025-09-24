import React, { useState } from 'react';
import { Check, X, Loader, Clock } from 'lucide-react';

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const HistoryTab = ({ reservation, onUpdate }) => {
  const [loadingId, setLoadingId] = useState(null);
  const { change_requests, created_at, updated_at } = reservation._original;

  const handleUpdateRequestStatus = async (requestId, status) => {
    setLoadingId(requestId);
    try {
      const response = await fetch(`http://localhost:4000/api/change-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      onUpdate(); // Refetch reservation data
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Solicitudes de Cambio</h3>
        <div className="space-y-4">
          {change_requests && change_requests.length > 0 ? (
            change_requests.map(req => (
              <div key={req.id} className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-700">Sección: <span className="font-normal">{req.section_to_change}</span></p>
                    <p className="text-sm text-gray-500 mt-1">Motivo: {req.request_reason}</p>
                    <div className="mt-2 text-xs font-mono bg-gray-100 p-2 rounded">{JSON.stringify(req.requested_changes)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[req.status]}`}>
                      {req.status}
                    </span>
                    {req.status === 'pending' && (
                      <div className="flex gap-2 mt-2">
                        {loadingId === req.id ? (
                          <Loader className="animate-spin w-5 h-5 text-gray-500" />
                        ) : (
                          <>
                            <button onClick={() => handleUpdateRequestStatus(req.id, 'approved')} className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600"><Check className="w-4 h-4" /></button>
                            <button onClick={() => handleUpdateRequestStatus(req.id, 'rejected')} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"><X className="w-4 h-4" /></button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No hay solicitudes de cambio para esta reserva.</p>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Historial de la Reserva</h3>
        <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-2 text-sm">
            <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400"/> Creada el: <span className="font-medium">{new Date(created_at).toLocaleString()}</span></p>
            <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400"/> Última modificación: <span className="font-medium">{new Date(updated_at).toLocaleString()}</span></p>
        </div>
      </div>
    </div>
  );
};

export default HistoryTab;
