import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Loader, Inbox, FileWarning } from 'lucide-react';

const ChangeRequestManager = ({ reservation, onUpdate }) => {
  const [loadingRequest, setLoadingRequest] = useState(null);

  const handleRequest = async (requestId, action) => {
    setLoadingRequest(requestId);
    const reason = action === 'reject' ? prompt('Por favor, introduce el motivo del rechazo:') : undefined;
    if (action === 'reject' && reason === null) { // User cancelled the prompt
        setLoadingRequest(null);
        return;
    }

    try {
      const response = await fetch(`http://localhost:4000/api/change-requests/${requestId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error al ${action === 'approve' ? 'aprobar' : 'rechazar'} la solicitud.`);
      }
      
      onUpdate(); // Refetch reservation data
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoadingRequest(null);
    }
  };

  const pendingRequests = reservation.change_requests?.filter(req => req.status === 'pending') || [];

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Solicitudes de Cambio Pendientes</h3>
      {pendingRequests.length > 0 ? (
        <div className="space-y-4">
          {pendingRequests.map(req => (
            <div key={req.id} className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                    <FileWarning className="w-5 h-5 text-yellow-600" />
                    Cambio solicitado en: <span className="text-yellow-800">{req.section_to_change}</span>
                </h4>
                <span className="text-xs text-gray-500">
                  Solicitado el: {new Date(req.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="bg-white p-3 rounded-md border mb-3">
                <p className="text-sm font-semibold text-gray-600">Motivo de la solicitud:</p>
                <p className="text-sm text-gray-800 italic">"{req.request_reason}"</p>
              </div>

              <div className="bg-white p-3 rounded-md border">
                <p className="text-sm font-semibold text-gray-600">Cambios propuestos:</p>
                <pre className="text-xs bg-gray-100 p-2 rounded-md overflow-x-auto">
                  {JSON.stringify(req.requested_changes, null, 2)}
                </pre>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4">
                <motion.button
                  onClick={() => handleRequest(req.id, 'reject')}
                  disabled={loadingRequest === req.id}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:bg-gray-400"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {loadingRequest === req.id ? <Loader className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                  Rechazar
                </motion.button>
                <motion.button
                  onClick={() => handleRequest(req.id, 'approve')}
                  disabled={loadingRequest === req.id}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:bg-gray-400"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {loadingRequest === req.id ? <Loader className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  Aprobar y Aplicar
                </motion.button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
            <Inbox className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay solicitudes de cambio pendientes.</p>
        </div>
      )}
    </div>
  );
};

export default ChangeRequestManager;