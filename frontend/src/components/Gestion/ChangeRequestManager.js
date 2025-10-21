import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Loader, Inbox, FileWarning, FileText, Download, ArrowRight, Code } from 'lucide-react';
import supabase from '../../utils/supabaseClient';
import api from '../../utils/api';

const ChangeRequestManager = ({ reservation, onUpdate }) => {
  const [loadingRequest, setLoadingRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [showJsonModal, setShowJsonModal] = useState(null);
  const [expandedRequest, setExpandedRequest] = useState(null);

  const handleApprove = async (requestId) => {
    if (!window.confirm('¿Estás seguro de que deseas aprobar esta solicitud? Los cambios se aplicarán inmediatamente.')) {
      return;
    }

    setLoadingRequest(requestId);

    try {
      await api.post(`/change-requests/${requestId}/approve`);
      alert('Solicitud aprobada y cambios aplicados exitosamente.');
      onUpdate(); // Refetch reservation data
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || error.message || 'Error al aprobar la solicitud.');
    } finally {
      setLoadingRequest(null);
    }
  };

  const handleReject = async (requestId) => {
    if (rejectReason.trim().length < 10) {
      alert('El motivo del rechazo debe tener al menos 10 caracteres.');
      return;
    }

    setLoadingRequest(requestId);

    try {
      await api.post(`/change-requests/${requestId}/reject`, {
        rejectionReason: rejectReason
      });

      alert('Solicitud rechazada exitosamente.');
      setShowRejectModal(null);
      setRejectReason('');
      onUpdate(); // Refetch reservation data
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || error.message || 'Error al rechazar la solicitud.');
    } finally {
      setLoadingRequest(null);
    }
  };

  const downloadDocument = async (filePath, fileName) => {
    try {
      // ✅ SEGURO: userId se obtiene automáticamente del token JWT
      const response = await api.post('/files/get-secure-url', {
        path: filePath
      });

      // Open the signed URL in a new tab
      window.open(response.data.signedUrl, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
      alert(`Error al descargar el documento: ${error.response?.data?.message || error.message}`);
    }
  };

  // Mostrar todas las solicitudes (pendientes, aprobadas, rechazadas)
  const allRequests = reservation.change_requests || [];
  const pendingRequests = allRequests.filter(req => req.status === 'pending');
  const processedRequests = allRequests.filter(req => req.status !== 'pending');

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

  // Extraer datos actuales de la reserva según la sección
  const getCurrentSectionData = (section) => {
    // Debug: ver estructura de la reserva
    console.log('Reservation object:', reservation);
    console.log('Section:', section);

    switch (section) {
      case 'client':
        // Intentar diferentes estructuras posibles
        const clientData = {
          name: reservation.clients?.name || reservation.client_name || reservation.clientName,
          email: reservation.clients?.email || reservation.client_email || reservation.clientEmail,
          phone: reservation.clients?.phone || reservation.client_phone || reservation.clientPhone,
          id_number: reservation.clients?.id_card || reservation.client_id || reservation.clientId
        };
        console.log('Client data extracted:', clientData);
        return clientData;

      case 'passengers':
        return {
          adults: reservation.passengers_adt,
          children: reservation.passengers_chd,
          infants: reservation.passengers_inf
        };

      case 'itinerary':
        const firstSegment = reservation.reservation_segments?.[0];
        return {
          origin: firstSegment?.origin,
          destination: firstSegment?.destination,
          departure_date: firstSegment?.departure_date,
          return_date: firstSegment?.return_date
        };

      case 'payment':
        return {
          price_adult: reservation.price_per_adt,
          price_child: reservation.price_per_chd,
          price_infant: reservation.price_per_inf,
          installments: reservation.installments
        };

      case 'flights':
        return { flights: reservation.reservation_flights };

      case 'hotels':
        return { hotels: reservation.reservation_hotels };

      case 'tours':
        return { tours: reservation.reservation_tours };

      case 'medicalAssistances':
        return { medicalAssistances: reservation.reservation_medical_assistances };

      case 'transfers':
        return {
          transfer_in: reservation.transfer_in,
          transfer_out: reservation.transfer_out
        };

      case 'cancellation':
        return null; // La cancelación no tiene datos previos

      default:
        return null;
    }
  };

  // Comparar y obtener solo los campos que cambiaron
  const getChangedFields = (section, newData) => {
    const currentData = getCurrentSectionData(section);

    if (!currentData || section === 'cancellation') {
      return null; // No hay comparación para cancelación
    }

    const changes = [];

    // Función recursiva para comparar objetos
    const compareValues = (current, proposed, path = '') => {
      if (typeof proposed === 'object' && proposed !== null && !Array.isArray(proposed)) {
        Object.keys(proposed).forEach(key => {
          compareValues(current?.[key], proposed[key], path ? `${path}.${key}` : key);
        });
      } else if (Array.isArray(proposed)) {
        // Para arrays, comparar longitud y elementos
        if (!Array.isArray(current) || current.length !== proposed.length || JSON.stringify(current) !== JSON.stringify(proposed)) {
          changes.push({
            field: path,
            oldValue: current,
            newValue: proposed,
            isArray: true
          });
        }
      } else {
        // Comparar valores primitivos
        // Solo agregar si hay un cambio real (valores diferentes y ambos definidos)
        if (current !== proposed && proposed !== undefined && proposed !== null && proposed !== '') {
          // No agregar si ambos son undefined/null
          if (!(current === undefined || current === null || current === '') || proposed !== current) {
            changes.push({
              field: path,
              oldValue: current,
              newValue: proposed,
              isArray: false
            });
          }
        }
      }
    };

    compareValues(currentData, newData);
    return changes;
  };

  // Renderizar comparación de cambios
  const renderChangeComparison = (section, proposedChanges) => {
    const changedFields = getChangedFields(section, proposedChanges);

    if (!changedFields || changedFields.length === 0) {
      // Si no hay cambios detectados o es cancelación, mostrar resumen normal
      return renderChangeSummary(section, proposedChanges);
    }

    // Mapeo de nombres de campos a etiquetas legibles
    const fieldLabels = {
      name: 'Nombre',
      email: 'Email',
      phone: 'Teléfono',
      id_number: 'Documento',
      adults: 'Adultos',
      children: 'Niños',
      infants: 'Infantes',
      origin: 'Origen',
      destination: 'Destino',
      departure_date: 'Fecha Salida',
      return_date: 'Fecha Retorno',
      price_adult: 'Precio Adulto',
      price_child: 'Precio Niño',
      price_infant: 'Precio Infante',
      transfer_in: 'Traslado IN',
      transfer_out: 'Traslado OUT',
      flights: 'Vuelos',
      hotels: 'Hoteles',
      tours: 'Tours',
      medicalAssistances: 'Asistencias Médicas',
      installments: 'Cuotas'
    };

    const formatValue = (value, field) => {
      if (value === null || value === undefined) return 'Sin definir';
      if (typeof value === 'boolean') return value ? 'Sí' : 'No';
      if (field.includes('date')) {
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return value;
        }
      }
      if (field.includes('price') || field.includes('amount')) return `$${value}`;
      return value;
    };

    return (
      <div className="space-y-3">
        {changedFields.map((change, idx) => (
          <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-bold text-blue-900 mb-2">
              {fieldLabels[change.field] || change.field}
            </p>

            {change.isArray ? (
              <div className="space-y-2">
                <div className="bg-white rounded p-2 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Cambio completo:</p>
                  {renderChangeSummary(section, proposedChanges)}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-red-50 border border-red-200 rounded p-2">
                  <p className="text-xs font-semibold text-red-600 mb-1">❌ Actual:</p>
                  <p className="text-sm text-red-800 font-medium">
                    {formatValue(change.oldValue, change.field)}
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded p-2">
                  <p className="text-xs font-semibold text-green-600 mb-1">✅ Nuevo:</p>
                  <p className="text-sm text-green-800 font-medium">
                    {formatValue(change.newValue, change.field)}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Botón para ver JSON completo */}
        <button
          onClick={() => setShowJsonModal(proposedChanges)}
          className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 mt-2"
        >
          <Code className="w-4 h-4" />
          Ver JSON completo
        </button>
      </div>
    );
  };

  const renderChangeSummary = (section, changes) => {
    if (!changes) return null;

    switch (section) {
      case 'client':
        return (
          <div className="space-y-2">
            {changes.name && (
              <div className="flex items-start gap-2">
                <span className="text-xs font-semibold text-gray-600 min-w-[100px]">Nombre:</span>
                <span className="text-xs text-gray-800">{changes.name}</span>
              </div>
            )}
            {changes.email && (
              <div className="flex items-start gap-2">
                <span className="text-xs font-semibold text-gray-600 min-w-[100px]">Email:</span>
                <span className="text-xs text-gray-800">{changes.email}</span>
              </div>
            )}
            {changes.phone && (
              <div className="flex items-start gap-2">
                <span className="text-xs font-semibold text-gray-600 min-w-[100px]">Teléfono:</span>
                <span className="text-xs text-gray-800">{changes.phone}</span>
              </div>
            )}
            {changes.id_number && (
              <div className="flex items-start gap-2">
                <span className="text-xs font-semibold text-gray-600 min-w-[100px]">Documento:</span>
                <span className="text-xs text-gray-800">{changes.id_number}</span>
              </div>
            )}
          </div>
        );

      case 'passengers':
        return (
          <div className="space-y-2">
            {changes.adults !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">Adultos:</span>
                <span className="text-xs text-gray-800">{changes.adults}</span>
              </div>
            )}
            {changes.children !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">Niños:</span>
                <span className="text-xs text-gray-800">{changes.children}</span>
              </div>
            )}
            {changes.infants !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">Infantes:</span>
                <span className="text-xs text-gray-800">{changes.infants}</span>
              </div>
            )}
          </div>
        );

      case 'itinerary':
        return (
          <div className="space-y-2">
            {changes.origin && (
              <div className="flex items-start gap-2">
                <span className="text-xs font-semibold text-gray-600 min-w-[100px]">Origen:</span>
                <span className="text-xs text-gray-800">{changes.origin}</span>
              </div>
            )}
            {changes.destination && (
              <div className="flex items-start gap-2">
                <span className="text-xs font-semibold text-gray-600 min-w-[100px]">Destino:</span>
                <span className="text-xs text-gray-800">{changes.destination}</span>
              </div>
            )}
            {changes.departure_date && (
              <div className="flex items-start gap-2">
                <span className="text-xs font-semibold text-gray-600 min-w-[100px]">Fecha Salida:</span>
                <span className="text-xs text-gray-800">{new Date(changes.departure_date).toLocaleDateString()}</span>
              </div>
            )}
            {changes.return_date && (
              <div className="flex items-start gap-2">
                <span className="text-xs font-semibold text-gray-600 min-w-[100px]">Fecha Retorno:</span>
                <span className="text-xs text-gray-800">{new Date(changes.return_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        );

      case 'flights':
        return (
          <div className="space-y-3">
            {changes.flights && changes.flights.map((flight, idx) => (
              <div key={idx} className="bg-blue-50 p-2 rounded border border-blue-200">
                <p className="text-xs font-bold text-blue-800 mb-1">Vuelo {idx + 1}</p>
                {flight.airline && <p className="text-xs"><span className="font-semibold">Aerolínea:</span> {flight.airline}</p>}
                {flight.flight_number && <p className="text-xs"><span className="font-semibold">Número:</span> {flight.flight_number}</p>}
                {flight.departure_date && <p className="text-xs"><span className="font-semibold">Salida:</span> {new Date(flight.departure_date).toLocaleDateString()}</p>}
                {flight.pnr && <p className="text-xs"><span className="font-semibold">PNR:</span> {flight.pnr}</p>}
              </div>
            ))}
          </div>
        );

      case 'hotels':
        return (
          <div className="space-y-3">
            {changes.hotels && changes.hotels.map((hotel, idx) => (
              <div key={idx} className="bg-purple-50 p-2 rounded border border-purple-200">
                <p className="text-xs font-bold text-purple-800 mb-1">Hotel {idx + 1}</p>
                {hotel.name && <p className="text-xs"><span className="font-semibold">Nombre:</span> {hotel.name}</p>}
                {hotel.check_in && <p className="text-xs"><span className="font-semibold">Check-in:</span> {new Date(hotel.check_in).toLocaleDateString()}</p>}
                {hotel.check_out && <p className="text-xs"><span className="font-semibold">Check-out:</span> {new Date(hotel.check_out).toLocaleDateString()}</p>}
                {hotel.room_type && <p className="text-xs"><span className="font-semibold">Tipo:</span> {hotel.room_type}</p>}
              </div>
            ))}
          </div>
        );

      case 'tours':
        return (
          <div className="space-y-3">
            {changes.tours && changes.tours.map((tour, idx) => (
              <div key={idx} className="bg-green-50 p-2 rounded border border-green-200">
                <p className="text-xs font-bold text-green-800 mb-1">Tour {idx + 1}</p>
                {tour.name && <p className="text-xs"><span className="font-semibold">Nombre:</span> {tour.name}</p>}
                {tour.date && <p className="text-xs"><span className="font-semibold">Fecha:</span> {new Date(tour.date).toLocaleDateString()}</p>}
                {tour.cost && <p className="text-xs"><span className="font-semibold">Costo:</span> ${tour.cost}</p>}
              </div>
            ))}
          </div>
        );

      case 'medicalAssistances':
        return (
          <div className="space-y-3">
            {changes.medicalAssistances && changes.medicalAssistances.map((assistance, idx) => (
              <div key={idx} className="bg-red-50 p-2 rounded border border-red-200">
                <p className="text-xs font-bold text-red-800 mb-1">Asistencia {idx + 1}</p>
                {assistance.plan && <p className="text-xs"><span className="font-semibold">Plan:</span> {assistance.plan}</p>}
                {assistance.start_date && <p className="text-xs"><span className="font-semibold">Inicio:</span> {new Date(assistance.start_date).toLocaleDateString()}</p>}
                {assistance.end_date && <p className="text-xs"><span className="font-semibold">Fin:</span> {new Date(assistance.end_date).toLocaleDateString()}</p>}
              </div>
            ))}
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-2">
            {changes.price_adult !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">Precio Adulto:</span>
                <span className="text-xs text-gray-800">${changes.price_adult}</span>
              </div>
            )}
            {changes.price_child !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">Precio Niño:</span>
                <span className="text-xs text-gray-800">${changes.price_child}</span>
              </div>
            )}
            {changes.price_infant !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">Precio Infante:</span>
                <span className="text-xs text-gray-800">${changes.price_infant}</span>
              </div>
            )}
            {changes.installments && (
              <div className="mt-2">
                <p className="text-xs font-semibold text-gray-600 mb-1">Cuotas:</p>
                <div className="space-y-1">
                  {changes.installments.map((inst, idx) => (
                    <p key={idx} className="text-xs text-gray-700">
                      Cuota {idx + 1}: ${inst.amount} - {new Date(inst.due_date).toLocaleDateString()}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'transfers':
        return (
          <div className="space-y-2">
            {changes.transfer_in !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">Traslado IN:</span>
                <span className={`text-xs px-2 py-1 rounded ${changes.transfer_in ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {changes.transfer_in ? 'Sí' : 'No'}
                </span>
              </div>
            )}
            {changes.transfer_out !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">Traslado OUT:</span>
                <span className={`text-xs px-2 py-1 rounded ${changes.transfer_out ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {changes.transfer_out ? 'Sí' : 'No'}
                </span>
              </div>
            )}
          </div>
        );

      case 'cancellation':
        // La cancelación ya se muestra por separado arriba
        return null;

      default:
        return (
          <pre className="text-xs bg-gray-100 p-2 rounded-md overflow-x-auto max-h-48">
            {JSON.stringify(changes, null, 2)}
          </pre>
        );
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Solicitudes de Cambio Pendientes</h3>
      {pendingRequests.length > 0 ? (
        <div className="space-y-4">
          {pendingRequests.map(req => (
            <div key={req.id} className={`p-4 border rounded-lg ${req.section_to_change === 'cancellation' ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                  <FileWarning className={`w-5 h-5 ${req.section_to_change === 'cancellation' ? 'text-red-600' : 'text-yellow-600'}`} />
                  {getSectionLabel(req.section_to_change)}
                </h4>
                <span className="text-xs text-gray-500">
                  Solicitado el: {new Date(req.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="bg-white p-3 rounded-md border mb-3">
                <p className="text-sm font-semibold text-gray-600">Motivo de la solicitud:</p>
                <p className="text-sm text-gray-800 italic">"{req.request_reason}"</p>
              </div>

              {/* Botón para ver detalles */}
              <motion.button
                onClick={() => setExpandedRequest(expandedRequest === req.id ? null : req.id)}
                className="w-full flex items-center justify-between px-4 py-2 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded-lg transition-colors mb-3"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <span className="text-sm font-semibold text-blue-800">
                  {expandedRequest === req.id ? 'Ocultar detalles' : 'Ver detalles de los cambios'}
                </span>
                <ArrowRight className={`w-5 h-5 text-blue-600 transition-transform ${expandedRequest === req.id ? 'rotate-90' : ''}`} />
              </motion.button>

              {/* Detalles expandibles */}
              {expandedRequest === req.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3 mb-3"
                >
                  {/* Show cancellation reason if it's a cancellation request */}
                  {req.section_to_change === 'cancellation' && req.requested_changes?.cancellation_reason && (
                    <div className="bg-white p-3 rounded-md border">
                      <p className="text-sm font-semibold text-gray-600">Motivo de cancelación:</p>
                      <p className="text-sm text-gray-800">{req.requested_changes.cancellation_reason}</p>
                    </div>
                  )}

                  {/* Show attached documents for cancellation */}
                  {req.section_to_change === 'cancellation' && req.requested_changes?.cancellation_letter && (
                    <div className="bg-white p-3 rounded-md border">
                      <p className="text-sm font-semibold text-gray-600 mb-2">Carta de cancelación adjunta:</p>
                      <motion.button
                        onClick={() => downloadDocument(req.requested_changes.cancellation_letter.file_url, req.requested_changes.cancellation_letter.file_name)}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FileText className="w-4 h-4" />
                        {req.requested_changes.cancellation_letter.file_name}
                        <Download className="w-4 h-4 ml-auto" />
                      </motion.button>
                      <p className="text-xs text-gray-500 mt-1">
                        Tamaño: {(req.requested_changes.cancellation_letter.file_size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  )}

                  <div className="bg-white p-3 rounded-md border">
                    <p className="text-sm font-semibold text-gray-600 mb-2">Cambios propuestos:</p>
                    {renderChangeComparison(req.section_to_change, req.requested_changes)}
                  </div>
                </motion.div>
              )}

              <div className="flex items-center justify-end gap-3 mt-4">
                <motion.button
                  onClick={() => setShowRejectModal(req.id)}
                  disabled={loadingRequest === req.id}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:bg-gray-400"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {loadingRequest === req.id ? <Loader className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                  Rechazar
                </motion.button>
                <motion.button
                  onClick={() => handleApprove(req.id)}
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

      {/* Solicitudes Procesadas (Aprobadas/Rechazadas) */}
      {processedRequests.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Historial de Solicitudes</h3>
          <div className="space-y-3">
            {processedRequests.map(req => (
              <div
                key={req.id}
                className={`p-4 border rounded-lg ${
                  req.status === 'approved' || req.status === 'applied'
                    ? 'bg-green-50 border-green-300'
                    : 'bg-red-50 border-red-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    {req.status === 'approved' || req.status === 'applied' ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-red-600" />
                    )}
                    {getSectionLabel(req.section_to_change)}
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    req.status === 'applied'
                      ? 'bg-blue-100 text-blue-800'
                      : req.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {req.status === 'applied' ? 'Aplicada' : req.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                  </span>
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                  <p>Solicitado el: {new Date(req.created_at).toLocaleDateString()}</p>
                  {req.reviewed_at && (
                    <p>Revisado el: {new Date(req.reviewed_at).toLocaleDateString()}</p>
                  )}
                  {req.status === 'rejected' && req.rejection_reason && (
                    <div className="mt-2 p-2 bg-white rounded border border-red-200">
                      <p className="font-semibold text-red-700">Motivo del rechazo:</p>
                      <p className="text-red-800 italic">"{req.rejection_reason}"</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">Rechazar Solicitud</h3>
            <p className="text-sm text-gray-600 mb-4">
              Por favor, proporciona un motivo detallado del rechazo (mínimo 10 caracteres):
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows="4"
              placeholder="Ejemplo: Los documentos presentados no cumplen con los requisitos necesarios para procesar la cancelación..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {rejectReason.length}/10 caracteres mínimos
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={loadingRequest || rejectReason.trim().length < 10}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400"
              >
                {loadingRequest ? 'Rechazando...' : 'Confirmar Rechazo'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal JSON Completo */}
      {showJsonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Code className="w-5 h-5" />
                JSON Completo (Solo Lectura)
              </h3>
              <button
                onClick={() => setShowJsonModal(null)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <pre className="text-xs bg-gray-100 p-4 rounded-lg overflow-x-auto font-mono">
                {JSON.stringify(showJsonModal, null, 2)}
              </pre>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowJsonModal(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ChangeRequestManager;