import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Mail,
  Phone,
  Eye,
  Users,
  Clock,
  MapPin,
  Globe,
  Plane,
  Hotel,
  Ticket,
  HeartPulse,
  Info
} from 'lucide-react';
import { RESERVATION_STATUS, PAYMENT_STATUS, filterReservationsByRole, canEditReservation, canApproveReservation } from '../utils/constants';
import ReservationManagementPanel from '../components/Gestion/ReservationManagementPanel';
import RejectReservationModal from '../components/Gestion/RejectReservationModal';
import ReservationFilters from '../components/Gestion/ReservationFilters';
import { useSettings } from '../utils/SettingsContext';
import { useAuth } from './AuthContext';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getUrgency = (departureDate) => {
  if (!departureDate) return null;
  const today = new Date();
  const departure = new Date(departureDate);
  today.setHours(0, 0, 0, 0);
  departure.setHours(0, 0, 0, 0);

  const diffTime = departure.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: 'Viaje pasado', badgeClasses: 'bg-gray-100 text-gray-600' };
  if (diffDays === 0) return { label: 'Sale hoy', badgeClasses: 'bg-red-100 text-red-700 border border-red-200 animate-pulse' };
  if (diffDays <= 3) return { label: 'Urgente', badgeClasses: 'bg-orange-100 text-orange-700 border border-orange-200' };
  if (diffDays <= 7) return { label: 'Proxima salida', badgeClasses: 'bg-yellow-100 text-yellow-700 border border-yellow-200' };
  return null;
};

const getReservationTypeLabel = (reservation) => {
  if (!reservation) return 'Servicios Varios';
  if (reservation.reservation_flights?.length > 0 && reservation.reservation_hotels?.length > 0) return 'Paquete Completo';
  if (reservation.reservation_flights?.length > 0) return 'Solo Vuelos';
  if (reservation.reservation_hotels?.length > 0) return 'Solo Hotel';
  if (reservation.reservation_tours?.length > 0) return 'Tours y Actividades';
  if (reservation.reservation_medical_assistances?.length > 0) return 'Asistencia Medica';
  return 'Servicios Varios';
};

const getReservationTypeIconConfig = (type) => {
  switch (type) {
    case 'all_inclusive':
      return { Icon: Globe, wrapperClass: 'bg-blue-500' };
    case 'flights_only':
      return { Icon: Plane, wrapperClass: 'bg-sky-500' };
    case 'hotel_only':
      return { Icon: Hotel, wrapperClass: 'bg-purple-500' };
    case 'tours_only':
      return { Icon: Ticket, wrapperClass: 'bg-amber-500' };
    case 'medical_assistance':
      return { Icon: HeartPulse, wrapperClass: 'bg-red-500' };
    default:
      return { Icon: Info, wrapperClass: 'bg-gray-500' };
  }
};

const StatusBadge = ({ config }) => {
  if (!config) {
    return null;
  }
  const IconRef = config.icon;
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
      {IconRef && <IconRef className="w-3 h-3" />}
      <span>{config.label}</span>
    </div>
  );
};

const primaryButtonClasses = 'flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200';
const actionButtonClasses = 'px-3 py-2 rounded-lg text-sm font-semibold transition-colors duration-150';

const transformReservationForGestion = (reservation) => {
  if (!reservation) {
    return reservation;
  }

  const firstSegment = reservation.reservation_segments?.[0];
  const passengersADT = Number(reservation.passengers_adt ?? reservation.passengersADT ?? 0);
  const passengersCHD = Number(reservation.passengers_chd ?? reservation.passengersCHD ?? 0);
  const passengersINF = Number(reservation.passengers_inf ?? reservation.passengersINF ?? 0);
  const totalPassengers = passengersADT + passengersCHD + passengersINF;
  const totalAmount = Number(reservation.total_amount ?? reservation.totalAmount ?? 0);

  // Calcular el estado de pago basado en las cuotas
  const installments = reservation.reservation_installments || [];
  let paymentStatus = 'pending';

  if (installments.length > 0) {
    const paidInstallments = installments.filter(inst => inst.status === 'paid');
    const totalPaid = paidInstallments.reduce((sum, inst) => sum + Number(inst.amount || 0), 0);

    if (totalPaid >= totalAmount) {
      paymentStatus = 'paid';
    } else if (totalPaid > 0) {
      paymentStatus = 'partial';
    } else {
      paymentStatus = 'pending';
    }
  }

  const destinationSummary = firstSegment ? `${firstSegment.origin ?? 'N/A'} -> ${firstSegment.destination ?? 'N/A'}` : 'Destino no especificado';

  return {
    ...reservation,
    clientName: reservation.clientName ?? reservation.clients?.name ?? '',
    clientEmail: reservation.clientEmail ?? reservation.clients?.email ?? '',
    clientPhone: reservation.clientPhone ?? reservation.clients?.phone ?? '',
    clientId: reservation.clientId ?? reservation.clients?.id_card ?? '',
    invoiceNumber: reservation.invoiceNumber ?? reservation.invoice_number ?? '',
    createdAt: reservation.createdAt ?? reservation.created_at ?? '',
    updatedAt: reservation.updatedAt ?? reservation.updated_at ?? '',
    departureDate: reservation.departureDate ?? firstSegment?.departure_date ?? reservation.departure_date ?? '',
    returnDate: reservation.returnDate ?? firstSegment?.return_date ?? reservation.return_date ?? '',
    totalAmount: totalAmount,
    total_amount: totalAmount,
    passengersADT,
    passengersCHD,
    passengersINF,
    totalPassengers,
    destinationSummary,
    paymentStatus,
    advisorName: reservation.advisorName ??
      (reservation.advisor?.last_name
        ? `${reservation.advisor.name} ${reservation.advisor.last_name}`
        : (reservation.advisor?.name || 'N/A')),
  };
};

const Gestion = () => {
  const [reservations, setReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [reservationToReject, setReservationToReject] = useState(null);
  const [activeFilters, setActiveFilters] = useState({});
  const [offices, setOffices] = useState([]);
  const { formatCurrency, formatDate } = useSettings();
  const { currentUser } = useAuth();

  const fetchReservations = useCallback(async () => {
    if (!currentUser) {
      return;
    }
    try {
      const url = `http://localhost:4000/api/reservations?userId=${currentUser.id}&userRole=${currentUser.role}`;
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        const normalizedData = Array.isArray(data) ? data : (data ? [data] : []);
        // Filtrar reservas según el rol del usuario
        const filteredData = filterReservationsByRole(normalizedData, currentUser);
        const transformed = filteredData.map(transformReservationForGestion);
        setReservations(transformed);

        setSelectedReservation(prev => {
          if (!prev) return prev;
          const prevId = prev._original?.id ?? prev.id;
          if (!prevId) return prev;
          const updated = transformed.find(item => item.id === prevId);
          if (!updated) return prev;
          return { ...updated, _original: updated };
        });
      } else {
        console.error('Error fetching reservations:', data.message);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  }, [currentUser]);

  const fetchOffices = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:4000/api/offices');
      const data = await response.json();
      if (response.ok) {
        setOffices(data);
      } else {
        console.error('Error fetching offices:', data.message);
      }
    } catch (error) {
      console.error('Error fetching offices:', error);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
    fetchOffices();
  }, [fetchReservations, fetchOffices]);

  // Función para calcular urgencia
  const calculateUrgency = (departureDate) => {
    if (!departureDate) return null;
    const today = new Date();
    const departure = new Date(departureDate);
    today.setHours(0, 0, 0, 0);
    departure.setHours(0, 0, 0, 0);

    const diffTime = departure.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'past';
    if (diffDays === 0) return 'today';
    if (diffDays <= 3) return 'urgent';
    if (diffDays <= 7) return 'soon';
    return null;
  };

  // Función de filtrado avanzada
  const filteredReservations = reservations.filter(reservation => {
    // Filtro por búsqueda de texto (incluye búsqueda de pasajeros)
    if (activeFilters.searchTerm) {
      const searchValue = activeFilters.searchTerm.toLowerCase();
      const clientName = reservation.clientName || '';
      const destination = reservation.destinationSummary || '';
      const invoice = reservation.invoiceNumber ? reservation.invoiceNumber.toString() : '';

      // Buscar en pasajeros
      const passengers = reservation._original?.reservation_passengers || [];
      const passengerMatch = passengers.some(passenger =>
        (passenger.name || '').toLowerCase().includes(searchValue) ||
        (passenger.lastname || '').toLowerCase().includes(searchValue) ||
        `${passenger.name || ''} ${passenger.lastname || ''}`.toLowerCase().includes(searchValue)
      );

      const basicMatch = (
        clientName.toLowerCase().includes(searchValue) ||
        destination.toLowerCase().includes(searchValue) ||
        invoice.toLowerCase().includes(searchValue)
      );

      if (!basicMatch && !passengerMatch) return false;
    }

    // Filtro por tipo de reserva
    if (activeFilters.reservationType) {
      const reservationType = reservation.reservation_type || reservation._original?.reservation_type;
      if (reservationType !== activeFilters.reservationType) return false;
    }

    // Filtro por oficina
    if (activeFilters.office) {
      const reservationOffice = reservation._original?.office_id || reservation.office_id;
      if (reservationOffice !== activeFilters.office) return false;
    }

    // Filtro por estado de reserva
    if (activeFilters.status) {
      if (reservation.status !== activeFilters.status) return false;
    }

    // Filtro por estado de pago
    if (activeFilters.paymentStatus) {
      const paymentStatus = reservation.paymentStatus ?? reservation.payment_status ?? reservation._original?.payment_status;
      if (paymentStatus !== activeFilters.paymentStatus) return false;
    }

    // Filtro por urgencia
    if (activeFilters.urgency) {
      const urgency = calculateUrgency(reservation.departureDate);
      if (urgency !== activeFilters.urgency) return false;
    }

    // Filtro por fecha desde
    if (activeFilters.dateFrom) {
      const departureDate = new Date(reservation.departureDate);
      const fromDate = new Date(activeFilters.dateFrom);
      if (departureDate < fromDate) return false;
    }

    // Filtro por fecha hasta
    if (activeFilters.dateTo) {
      const departureDate = new Date(reservation.departureDate);
      const toDate = new Date(activeFilters.dateTo);
      if (departureDate > toDate) return false;
    }

    return true;
  });

  const sortedReservations = [...filteredReservations].sort((a, b) => {
    if (a.status === b.status) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (a.status === 'pending') return -1;
    if (b.status === 'pending') return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const handleViewReservationDetail = (reservation) => {
    setSelectedReservation({
      ...reservation,
      _original: reservation,
    });
  };

  const handleBackToList = () => {
    setSelectedReservation(null);
  };

  const handleApprove = async (reservationId) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`http://localhost:4000/api/reservations/${reservationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ managerId: currentUser.id })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al aprobar la reserva');
      }
      fetchReservations();
    } catch (error) {
      console.error('Error approving reservation:', error);
      alert(error.message);
    }
  };

  const handleRejectClick = (reservation) => {
    setReservationToReject(reservation);
    setShowRejectModal(true);
  };

  const handleReject = async (reservationId, reason) => {
    try {
      const response = await fetch(`http://localhost:4000/api/reservations/${reservationId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          reason,
          rejectedBy: currentUser.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al rechazar la reserva');
      }

      // Cerrar modal y refrescar
      setShowRejectModal(false);
      setReservationToReject(null);
      setSelectedReservation(null);
      fetchReservations();

      // TODO: Aquí podrías mostrar un mensaje de éxito
      alert('Reserva rechazada correctamente. El asesor ha sido notificado.');
    } catch (error) {
      console.error('Error rejecting reservation:', error);
      throw error; // Re-lanzar para que el modal lo maneje
    }
  };

  const handleUpdateReservation = async (updatedReservation) => {
    try {
      // Crear una copia del payload sin las cuotas de pago
      const payload = { ...(updatedReservation._original || updatedReservation) };

      // ⚠️ IMPORTANTE: Eliminar installments del payload para preservar estados de pago
      // Las cuotas solo deben actualizarse desde el módulo de Finanzas
      delete payload.reservation_installments;
      delete payload.installments;

      // Los transfers se envían normalmente ahora (el backend los procesa correctamente)

      payload.updateContext = payload.updateContext || 'general';

      const response = await fetch(`http://localhost:4000/api/reservations/${updatedReservation.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar la reserva');
      }

      alert('Reserva actualizada con exito');
      fetchReservations();
      setSelectedReservation(updatedReservation);
    } catch (error) {
      console.error('Error updating reservation:', error);
      alert(error.message);
    }
  };

  return (
    <motion.div
      className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {!selectedReservation && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion de Reservas</h1>
              <p className="text-sm text-gray-500">Controla el estado, pagos y servicios contratados con una vista unificada.</p>
            </div>
          </div>

          {/* Componente de Filtros */}
          <ReservationFilters
            reservations={reservations}
            onFilterChange={setActiveFilters}
            currentUser={currentUser}
            availableOffices={offices}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {sortedReservations.length > 0 ? (
                sortedReservations.map((reservation, index) => {
                  const urgency = getUrgency(reservation.departureDate);
                  const reservationTypeLabel = getReservationTypeLabel(reservation);
                  const reservationTypeKey = reservation.reservation_type || reservation._original?.reservation_type || 'other';
                  const { Icon: TypeIcon, wrapperClass } = getReservationTypeIconConfig(reservationTypeKey);
                  const statusConfig = RESERVATION_STATUS[reservation.status];
                  const paymentStatusKey = reservation.paymentStatus ?? reservation.payment_status ?? reservation._original?.payment_status;
                  const paymentConfig = paymentStatusKey ? PAYMENT_STATUS[paymentStatusKey] : null;

                  // Verificar si el usuario puede aprobar/rechazar esta reserva
                  const canApprove = canApproveReservation(currentUser, reservation);

                  return (
                    <motion.div
                      key={reservation.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col h-full overflow-hidden hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex items-start justify-between p-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${wrapperClass}`}>
                            <TypeIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Factura / ID</p>
                            <p className="text-lg font-bold text-blue-600 font-mono">
                              {reservation.invoiceNumber || reservation.id}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {/* Badge de Solicitudes de Cambio Pendientes */}
                          {reservation._original?.change_requests?.filter(req => req.status === 'pending').length > 0 && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300 animate-pulse">
                              📝 {reservation._original.change_requests.filter(req => req.status === 'pending').length} Solicitud{reservation._original.change_requests.filter(req => req.status === 'pending').length !== 1 ? 'es' : ''}
                            </span>
                          )}
                          {urgency && (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${urgency.badgeClasses}`}>
                              {urgency.label}
                            </span>
                          )}
                          {statusConfig && <StatusBadge config={statusConfig} />}
                        </div>
                      </div>

                      <div className="p-5 space-y-4 flex-1">
                        <div className="space-y-2">
                          <h3 className="text-lg font-bold text-gray-900 truncate" title={reservation.clientName || 'Cliente'}>
                            {reservation.clientName || 'Cliente sin nombre'}
                          </h3>
                          <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                            <p className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="truncate" title={reservation.clientEmail}>{reservation.clientEmail || 'Sin correo registrado'}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span>{reservation.clientPhone || 'Sin telefono registrado'}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <MapPin className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Itinerario</p>
                            <p className="text-sm font-medium text-gray-900">{reservation.destinationSummary}</p>
                            <p className="text-xs text-gray-500 mt-1">{reservationTypeLabel}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Salida</p>
                              <p className="font-medium text-gray-900">{formatDate(reservation.departureDate) || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Creada</p>
                              <p className="font-medium text-gray-900">{formatDate(reservation.createdAt) || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Regreso</p>
                              <p className="font-medium text-gray-900">{formatDate(reservation.returnDate) || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Pasajeros</p>
                              <p className="font-medium text-gray-900">{reservation.totalPassengers}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 border-t border-gray-200 bg-gray-50 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Servicios</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(reservation.total_amount)}</p>
                          </div>
                          {paymentConfig && <StatusBadge config={paymentConfig} />}
                        </div>

                        <div className="flex flex-wrap justify-end gap-2">
                          {reservation.status === 'pending' && canApprove && (
                            <>
                              <motion.button
                                onClick={() => handleApprove(reservation.id)}
                                className={`${actionButtonClasses} bg-emerald-100 text-emerald-700 hover:bg-emerald-200`}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                              >
                                Aprobar
                              </motion.button>
                              <motion.button
                                onClick={() => handleRejectClick(reservation)}
                                className={`${actionButtonClasses} bg-red-100 text-red-700 hover:bg-red-200`}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                              >
                                Rechazar
                              </motion.button>
                            </>
                          )}
                          <motion.button
                            onClick={() => handleViewReservationDetail(reservation)}
                            className={primaryButtonClasses}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Eye className="w-4 h-4" />
                            Gestionar
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="col-span-full text-center py-12 text-gray-500 text-lg"
                >
                  No se encontraron reservaciones.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {selectedReservation && (
        <ReservationManagementPanel
          reservation={selectedReservation}
          onBack={handleBackToList}
          onUpdate={fetchReservations}
          onApprove={handleApprove}
          onReject={(reservationId) => {
            const reservation = reservations.find(r => r.id === reservationId);
            if (reservation) {
              handleRejectClick(reservation);
            }
          }}
        />
      )}

      {showRejectModal && reservationToReject && (
        <RejectReservationModal
          reservation={reservationToReject}
          onReject={handleReject}
          onClose={() => {
            setShowRejectModal(false);
            setReservationToReject(null);
          }}
        />
      )}
    </motion.div>
  );
};

export default Gestion;
