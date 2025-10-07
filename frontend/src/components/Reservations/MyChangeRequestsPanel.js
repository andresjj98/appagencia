import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Loader, AlertCircle } from 'lucide-react';

const MyChangeRequestsPanel = ({ reservationId }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyRequests();
  }, [reservationId]);

  const fetchMyRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching change requests for reservation:', reservationId);
      console.log('Token:', token ? 'Present' : 'Missing');

      const response = await fetch('http://localhost:4000/api/change-requests/my-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        console.log('All my requests:', data.requests);
        console.log('Number of requests:', data.requests?.length || 0);

        if (!data.requests || data.requests.length === 0) {
          console.warn('No change requests found for current user');
          setRequests([]);
          return;
        }

        // Filtrar solo las solicitudes de esta reserva
        const filtered = data.requests.filter(req => req.reservation_id === reservationId);
        console.log('Filtered requests for this reservation:', filtered);
        console.log('Reservation ID type:', typeof reservationId, reservationId);
        console.log('Request reservation_id types:', data.requests.map(r => ({ id: r.reservation_id, type: typeof r.reservation_id })));
        setRequests(filtered);
      } else {
        const errorText = await response.text();
        console.error('Response not ok:', response.status, response.statusText, errorText);
      }
    } catch (error) {
      console.error('Error fetching change requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        icon: Clock,
        label: 'Pendiente',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-300'
      },
      approved: {
        icon: CheckCircle,
        label: 'Aprobada',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-300'
      },
      applied: {
        icon: CheckCircle,
        label: 'Aplicada',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-300'
      },
      rejected: {
        icon: XCircle,
        label: 'Rechazada',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-300'
      }
    };
    return configs[status] || configs.pending;
  };

  const getSectionLabel = (section) => {
    const labels = {
      client: 'Información del Cliente',
      passengers: 'Pasajeros',
      itinerary: 'Itinerario',
      flights: 'Vuelos',
      hotels: 'Hoteles',
      tours: 'Tours',
      medicalAssistances: 'Asistencias Médicas',
      payment: 'Información de Pago',
      transfers: 'Traslados IN/OUT',
      cancellation: 'Cancelación de Reserva'
    };
    return labels[section] || section;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Cargando solicitudes...</span>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No has creado solicitudes de cambio para esta reserva</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Mis Solicitudes de Cambio</h3>

      {requests.map((request) => {
        const statusConfig = getStatusConfig(request.status);
        const StatusIcon = statusConfig.icon;

        return (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg border ${statusConfig.borderColor} ${statusConfig.bgColor}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <StatusIcon className={`w-5 h-5 ${statusConfig.textColor}`} />
                  <span className={`font-bold ${statusConfig.textColor}`}>
                    {statusConfig.label}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  Sección: {getSectionLabel(request.section_to_change)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Solicitado el: {new Date(request.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            {request.request_reason && (
              <div className="bg-white bg-opacity-50 rounded p-2 mb-2">
                <p className="text-xs font-semibold text-gray-600">Motivo:</p>
                <p className="text-sm text-gray-800">{request.request_reason}</p>
              </div>
            )}

            {request.status === 'rejected' && request.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                <p className="text-xs font-semibold text-red-700">Motivo del rechazo:</p>
                <p className="text-sm text-red-800">{request.rejection_reason}</p>
              </div>
            )}

            {request.status === 'approved' && !request.applied_at && (
              <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                <p className="text-xs text-blue-700">
                  ✓ Aprobada - Los cambios se aplicarán pronto
                </p>
              </div>
            )}

            {request.status === 'applied' && (
              <div className="bg-green-50 border border-green-200 rounded p-2 mt-2">
                <p className="text-xs text-green-700">
                  ✓ Cambios aplicados exitosamente el {new Date(request.applied_at).toLocaleString()}
                </p>
              </div>
            )}

            {request.reviewed_at && (
              <p className="text-xs text-gray-500 mt-2">
                Revisado el: {new Date(request.reviewed_at).toLocaleString()}
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default MyChangeRequestsPanel;
