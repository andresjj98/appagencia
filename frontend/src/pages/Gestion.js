import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  User, 
  Calendar, 
  Edit, 
  FileText, 
  Upload, 
  Download, 
  Mail, 
  Phone,
  Eye,
  PlusCircle,
  ArrowLeft,
  DollarSign,
  Users,
  Clock,
  Package,
  AlertTriangle
} from 'lucide-react';
import { RESERVATION_STATUS } from '../utils/constants';
import ReservationManagementPanel from '../components/Gestion/ReservationManagementPanel';
import { useSettings } from '../utils/SettingsContext';
import { useAuth } from './AuthContext';

const getUrgency = (departureDate) => {
    if (!departureDate) return null;
    const today = new Date();
    const departure = new Date(departureDate);
    today.setHours(0, 0, 0, 0);
    departure.setHours(0, 0, 0, 0);

    const diffTime = departure.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: '¡VIAJE PASADO!', color: 'bg-gray-500 text-white' };
    if (diffDays === 0) return { label: '¡SALE HOY!', color: 'bg-red-600 text-white animate-pulse' };
    if (diffDays <= 3) return { label: 'URGENCIA MÁXIMA', color: 'bg-red-500 text-white' };
    if (diffDays <= 7) return { label: 'PRÓXIMA A SALIR', color: 'bg-yellow-400 text-yellow-900' };
    return null;
};

const getReservationType = (reservation) => {
    if (reservation.reservation_flights?.length > 0 && reservation.reservation_hotels?.length > 0) return 'Paquete Completo';
    if (reservation.reservation_flights?.length > 0) return 'Solo Vuelos';
    if (reservation.reservation_hotels?.length > 0) return 'Solo Hotel';
    if (reservation.reservation_tours?.length > 0) return 'Tours y Actividades';
    return 'Servicios Varios';
};

const Gestion = () => {
  const [reservations, setReservations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReservation, setSelectedReservation] = useState(null);
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
        setReservations(data);
      } else {
        console.error('Error fetching reservations:', data.message);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const filteredReservations = reservations.filter(reservation => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const clientName = reservation.clientName || '';
    
    const firstSegment = reservation.reservation_segments && reservation.reservation_segments[0];
    const destination = firstSegment ? `${firstSegment.origin} - ${firstSegment.destination}` : '';

    const invoice = reservation.invoiceNumber ? reservation.invoiceNumber.toString() : '';
    return (
      clientName.toLowerCase().includes(lowerCaseSearchTerm) ||
      destination.toLowerCase().includes(lowerCaseSearchTerm) ||
      invoice.toLowerCase().includes(lowerCaseSearchTerm)
    );
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
    // The detail components expect a specific structure where the full reservation object
    // is nested under an `_original` key. We create that structure here.
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerId: currentUser.id })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al aprobar la reserva');
      }
      fetchReservations(); // Refetch to get updated data
    } catch (error) {
      console.error('Error approving reservation:', error);
      alert(error.message);
    }
  };

  const handleReject = async (reservationId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/reservations/${reservationId}/reject`, { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al rechazar la reserva');
      }
      fetchReservations(); // Refetch to get updated data
    } catch (error) {
      console.error('Error rejecting reservation:', error);
      alert(error.message);
    }
  };

  const handleUpdateReservation = async (updatedReservation) => {
    try {
      const response = await fetch(`http://localhost:4000/api/reservations/${updatedReservation.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedReservation._original),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar la reserva');
      }

      alert('Reserva actualizada con éxito');

      // Refetch reservations to get the latest data
      fetchReservations();
      // Update the selected reservation to show the changes immediately
      setSelectedReservation(updatedReservation);
    } catch (error) {
      console.error('Error updating reservation:', error);
      alert(error.message);
    }
  };

  return (
    <motion.div
      className="p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {!selectedReservation && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Reservas</h2>
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar cliente o reserva..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {sortedReservations.length > 0 ? (
                sortedReservations.map((reservation, index) => {
                  const urgency = getUrgency(reservation.departureDate);
                  const reservationType = getReservationType(reservation);
                  const firstSegment = reservation.reservation_segments && reservation.reservation_segments[0];
                  const destinationDisplay = firstSegment ? `${firstSegment.origin} - ${firstSegment.destination}` : 'Destino no especificado';

                  return (
                    <motion.div
                      key={reservation.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 mr-2">
                            <h3 className="text-lg font-bold text-gray-900 truncate" title={destinationDisplay}>{destinationDisplay}</h3>
                            <p className="text-sm text-gray-500 font-mono">{reservation.invoiceNumber ? `Reserva numero: ${reservation.invoiceNumber}` : `ID: ${reservation.id}`}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${RESERVATION_STATUS[reservation.status]?.bgColor} ${RESERVATION_STATUS[reservation.status]?.textColor}`}>
                            {RESERVATION_STATUS[reservation.status]?.label}
                          </span>
                        </div>

                        {urgency && (
                          <div className={`mb-4 p-2 rounded-lg text-center text-xs font-bold ${urgency.color} flex items-center justify-center gap-2`}>
                            <AlertTriangle className="w-4 h-4" />
                            {urgency.label}
                          </div>
                        )}

                        <div className="space-y-3 text-sm text-gray-700 mb-4">
                          <p className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400 flex-shrink-0" /> <span className="truncate" title={reservation.clientName}>{reservation.clientName}</span></p>
                          <p className="flex items-center gap-2"><Package className="w-4 h-4 text-gray-400 flex-shrink-0" /> {reservationType}</p>
                          <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400 flex-shrink-0" /> Creada: {formatDate(reservation.createdAt)}</p>
                          <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" /> Salida: {formatDate(reservation.departureDate)}</p>
                          <p className="flex items-center gap-2 font-semibold text-base text-gray-800 mt-2"><DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" /> Total: {formatCurrency(reservation.total_amount)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 mt-auto pt-4 border-t border-gray-100">
                        {reservation.status === 'pending' && (
                          <>
                            <motion.button onClick={() => handleApprove(reservation.id)} className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-semibold" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              Aprobar
                            </motion.button>
                            <motion.button onClick={() => handleReject(reservation.id)} className="px-3 py-1 bg-red-100 text-red-800 rounded-lg text-xs font-semibold" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              Rechazar
                            </motion.button>
                          </>
                        )}
                        <motion.button
                          onClick={() => handleViewReservationDetail(reservation)}
                          className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Eye className="w-4 h-4" />
                          Gestionar
                        </motion.button>
                      </div>
                    </motion.div>
                  )
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
        </>
      )}

      {selectedReservation && (
        <ReservationManagementPanel 
          reservation={selectedReservation} 
          onBack={handleBackToList} 
          onUpdate={handleUpdateReservation}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </motion.div>
  );
};

export default Gestion;