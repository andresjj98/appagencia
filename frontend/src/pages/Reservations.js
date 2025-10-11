import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, SortAsc } from 'lucide-react';
import ReservationSummary from '../components/Reservations/ReservationSummary';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ReservationCard from '../components/Reservations/ReservationCard';
import ReservationForm from '../components/Reservations/ReservationForm';
import ReservationTypeSelector from '../components/Reservations/ReservationTypeSelector';
import ReservationFullDetail from '../components/Reservations/ReservationFullDetail';
import CancelRequestModal from '../components/Reservations/CancelRequestModal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import LoadingOverlay from '../components/common/LoadingOverlay'; // Import the new component

import { useAuth } from './AuthContext';
import { filterReservationsByRole, canEditReservation } from '../utils/constants';
// The `ChangeRequestModal` component is incorrectly located in the `CancelRequestModal.js` file.
const ChangeRequestModal = CancelRequestModal;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const buildJsonHeaders = () => ({
  'Content-Type': 'application/json',
  ...getAuthHeaders(),
});

const getPaymentStatus = (reservation) => {
    const installments = reservation.reservation_installments || [];
    if (installments.length === 0) {
        if (reservation.payment_option === 'full_payment' && reservation.status === 'confirmed') {
            return 'paid';
        }
        return 'pending';
    }

    const allPaid = installments.every(p => p.status === 'paid');
    if (allPaid) {
      return 'paid';
    }

    const somePaid = installments.some(p => p.status === 'paid');
    if (somePaid) {
        return 'partial';
    }

    return 'pending';
};

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [selectedReservationType, setSelectedReservationType] = useState(null);
  const [reservationToConfirm, setReservationToConfirm] = useState(false); // Changed to boolean
  const [showSummary, setShowSummary] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false); // New state
  const [selectedReservationForDetails, setSelectedReservationForDetails] = useState(null); // New state
  const [showChangeRequest, setShowChangeRequest] = useState(false);
  const [reservationForChange, setReservationForChange] = useState(null);
  const [showCancelRequest, setShowCancelRequest] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // State for delete confirmation
  const [reservationToDelete, setReservationToDelete] = useState(null); // State for reservation to delete
  const [filter, setFilter] = useState('all');
  const [filterType, setFilterType] = useState('all'); // New state for reservation type filter
  const [sortBy, setSortBy] = useState('date');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // New state for saving overlay
  const { currentUser } = useAuth(); // Get the logged-in user

  const transformReservationForDetails = (res) => {
    if (!res) return null;

    return {
      clientName: res.clients?.name || '',
      clientId: res.clients?.id_card || '',
      clientEmail: res.clients?.email || '',
      clientPhone: res.clients?.phone || '',
      clientAddress: res.clients?.address || '',
      emergencyContact: {
        name: res.clients?.emergency_contact_name || '',
        phone: res.clients?.emergency_contact_phone || ''
      },
      segments: (res.reservation_segments || []).map(seg => ({
        origin: seg.origin,
        destination: seg.destination,
        departureDate: seg.departure_date,
        returnDate: seg.return_date
      })),
      passengersADT: res.passengers_adt || 0,
      passengersCHD: res.passengers_chd || 0,
      passengersINF: res.passengers_inf || 0,
      flights: res.reservation_flights || [],
      hotels: res.reservation_hotels || [],
      tours: res.reservation_tours || [],
      medicalAssistances: res.reservation_medical_assistances || [],
      pricePerADT: res.price_per_adt,
      pricePerCHD: res.price_per_chd,
      pricePerINF: res.price_per_inf,
      totalAmount: res.total_amount,
      paymentOption: res.payment_option,
      installments: (res.installments || []).map(inst => ({
        amount: inst.amount,
        dueDate: inst.due_date
      })),
      notes: res.notes
    };
  };

  const handleViewReservationDetails = useCallback((reservation) => {
    setSelectedReservationForDetails(reservation);
    setShowDetailsModal(true);
  }, []);

  const handleUpdateReservationDetails = async (updatedReservation) => {
    console.log('=== RESERVATIONS.JS UPDATE ===');
    console.log('Updating reservation details:', updatedReservation);
    console.log('Has reservation_passengers?', !!updatedReservation?.reservation_passengers);

    // Actualizar la reserva seleccionada con los nuevos datos
    if (updatedReservation) {
      console.log('Updating selectedReservationForDetails with fresh data');

      // Transform the updated reservation data to include _original
      const transformedUpdate = {
        ...selectedReservationForDetails,
        _original: updatedReservation,
        reservation_passengers: updatedReservation.reservation_passengers
      };

      setSelectedReservationForDetails(transformedUpdate);

      // Recargar la lista de reservas para mantenerla sincronizada
      fetchReservations();
    }
  };

  const transformReservationData = (apiData) => {
    return apiData.map(res => {
      const firstSegment = res.reservation_segments && res.reservation_segments[0];
      const passengers = (res.passengers_adt || 0) + (res.passengers_chd || 0) + (res.passengers_inf || 0);
      const paymentStatus = getPaymentStatus(res);

      return {
        id: res.id,
        clientName: res.clients?.name,
        clientEmail: res.clients?.email,
        clientPhone: res.clients?.phone,
        clientId: res.clients?.id_card,
        destination: firstSegment ? `${firstSegment.origin} - ${firstSegment.destination}` : 'N/A',
        departureDate: firstSegment ? firstSegment.departure_date : null,
        returnDate: firstSegment ? firstSegment.return_date : null,
        passengers: passengers,
        totalAmount: res.total_amount,
        status: res.status,
        paymentStatus: paymentStatus,
        advisorName: res.advisor?.last_name
          ? `${res.advisor.name} ${res.advisor.last_name}`
          : (res.advisor?.name || 'N/A'), // Use advisor name from backend
        notes: res.notes,
        _original: res 
      };
    });
  };

  const fetchReservations = useCallback(async () => {
    setIsLoading(true);
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    try {
      let url = `http://localhost:4000/api/reservations?userId=${currentUser.id}&userRole=${currentUser.role}`;
      if (filterType !== 'all') {
        url += `&reservation_type=${filterType}`;
      }
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        const transformedData = transformReservationData(data);
        // Filtrar reservas según el rol del usuario
        const filteredData = filterReservationsByRole(transformedData.map(r => r._original), currentUser);
        const finalData = transformedData.filter(r =>
          filteredData.some(fr => fr.id === r.id)
        );
        setReservations(finalData);
      } else {
        console.error('Error fetching reservations:', data.message);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, filterType]); // Add filterType to dependency array

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleNewReservationClick = () => {
    setEditingReservation(null);
    setShowTypeSelector(true);
  };

  const handleSelectReservationType = (type) => {
    setSelectedReservationType(type);
    setShowTypeSelector(false);
    setShowForm(true);
  };

  const handleEditReservation = (reservation) => {
    if (reservation.status !== 'confirmed') {
      setEditingReservation(reservation._original);
      setSelectedReservationType(
        reservation._original.reservation_type || 'all_inclusive'
      );
      setShowForm(true);
    } else {
      setReservationForChange(reservation._original);
      setShowChangeRequest(true);
    }
  };

  const handleFinalSaveReservation = async (reservationData) => {
    setIsSaving(true); // Show loading overlay
    const url = editingReservation
      ? `http://localhost:4000/api/reservations/${editingReservation.id}`
      : 'http://localhost:4000/api/reservations';
    const method = editingReservation ? 'PUT' : 'POST';

    // Convert transfers object to array format for backend
    const dataToSend = { ...reservationData };
    if (dataToSend.transfers && typeof dataToSend.transfers === 'object' && !Array.isArray(dataToSend.transfers)) {
      const transfersArray = [];
      Object.keys(dataToSend.transfers).forEach(segmentIndex => {
        const segmentTransfers = dataToSend.transfers[segmentIndex];
        const idx = parseInt(segmentIndex);

        if (segmentTransfers.hasIn) {
          transfersArray.push({
            segmentIndex: idx,
            transferType: 'arrival'
          });
        }

        if (segmentTransfers.hasOut) {
          transfersArray.push({
            segmentIndex: idx,
            transferType: 'departure'
          });
        }
      });
      dataToSend.transfers = transfersArray;
    }

    if (method === 'PUT' && !dataToSend.updateContext) {
      dataToSend.updateContext = 'general';
    }

    try {
      const response = await fetch(url, {
        method,
        headers: buildJsonHeaders(),
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (response.ok) {
        setShowForm(false);
        setEditingReservation(null);
        setSelectedReservationType(null);
        fetchReservations(); // Refetch all reservations
      } else {
        console.error('Error saving reservation:', result.message);
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error saving reservation:', error);
      alert('An unexpected error occurred.');
    } finally {
      setIsSaving(false); // Hide loading overlay
    }
  };

  const handleReservationSubmit = (reservationData) => {
    if (editingReservation) {
      handleFinalSaveReservation(reservationData);
    } else {
      setReservationToConfirm(reservationData);
      setShowSummary(true);
    }
  };

  const handleConfirmReservation = () => {
    if (reservationToConfirm) {
      handleFinalSaveReservation(reservationToConfirm);
      setReservationToConfirm(null);
      setShowSummary(false);
    }
  };

  const handleCancelSummary = () => {
    setShowSummary(false);
  };

  const handleDeleteReservation = (reservation) => {
    if (reservation.status !== 'confirmed') {
      setReservationToDelete(reservation);
      setShowDeleteConfirm(true);
    } else {
      setReservationToCancel(reservation);
      setShowCancelRequest(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!reservationToDelete) return;
    setIsSaving(true); // Show loading overlay for delete
    try {
      const response = await fetch(`http://localhost:4000/api/reservations/${reservationToDelete.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        fetchReservations();
      } else {
        const result = await response.json();
        console.error('Error deleting reservation:', result.message);
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting reservation:', error);
      alert('An unexpected error occurred.');
    } finally {
      setReservationToDelete(null);
      setShowDeleteConfirm(false);
      setIsSaving(false); // Hide loading overlay
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    if (filter === 'all') return true;
    return reservation.status === filter;
  });

  const sortedReservations = [...filteredReservations].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b._original.created_at) - new Date(a._original.created_at);
      case 'departure':
        const dateA = a.departureDate ? new Date(a.departureDate) : 0;
        const dateB = b.departureDate ? new Date(b.departureDate) : 0;
        return dateA - dateB;
      case 'amount':
        return b.totalAmount - a.totalAmount;
      default:
        return 0;
    }
  });

  return (
    <DndProvider backend={HTML5Backend}>
      <AnimatePresence>{isSaving && <LoadingOverlay />}</AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-6 space-y-6">
          {/* Filters and Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas las reservas</option>
                  <option value="pending">Pendientes</option>
                  <option value="confirmed">Confirmadas</option>
                  <option value="cancelled">Canceladas</option>
                  <option value="completed">Completadas</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="all_inclusive">Paquete Todo Incluido</option>
                  <option value="flights_only">Solo Vuelos</option>
                  <option value="hotel_only">Solo Hotel</option>
                  <option value="tours_only">Solo Tours</option>
                  <option value="medical_assistance">Asistencia Médica</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <SortAsc className="w-5 h-5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">Fecha de creación</option>
                  <option value="departure">Fecha de salida</option>
                  <option value="amount">Monto total</option>
                </select>
              </div>
            </div>

            <motion.button
              onClick={handleNewReservationClick}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Nueva Reserva
            </motion.button>
          </div>

          {/* Reservations Grid */}
          {isLoading ? (
            <div className="text-center py-12">Cargando...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {sortedReservations.map((reservation, index) => (
                  <ReservationCard
                    key={reservation.id}
                    reservation={reservation}
                    index={index}
                    onEdit={handleEditReservation}
                    onDelete={handleDeleteReservation}
                    onView={handleViewReservationDetails}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && sortedReservations.length === 0 && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-gray-500 text-lg">No se encontraron reservas</p>
              <p className="text-gray-400 mt-2">Ajusta los filtros o crea una nueva reserva</p>
            </motion.div>
          )}
        </div>

        {/* MODALS ARE HERE */}
        <AnimatePresence>
          {showTypeSelector && (
            <ReservationTypeSelector 
              onSelectType={handleSelectReservationType} 
              onClose={() => setShowTypeSelector(false)} 
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showForm && (
            <ReservationForm
              reservation={editingReservation}
              reservationType={selectedReservationType}
              onSave={handleReservationSubmit}
              onClose={() => {
                setShowForm(false);
                setEditingReservation(null);
                setSelectedReservationType(null);
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSummary && reservationToConfirm && (
            <ReservationSummary
              reservation={reservationToConfirm}
              onConfirm={handleConfirmReservation}
              onCancel={handleCancelSummary}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showDetailsModal && selectedReservationForDetails && (
            <ReservationFullDetail
              reservation={selectedReservationForDetails}
              onUpdateReservation={handleUpdateReservationDetails}
              onClose={() => {
                setShowDetailsModal(false);
                setSelectedReservationForDetails(null);
              }}
              onEdit={() => {
                setShowDetailsModal(false);
                handleEditReservation(selectedReservationForDetails);
                setSelectedReservationForDetails(null);
              }}
              onRequestChange={(reservation) => {
                setShowDetailsModal(false);
                handleEditReservation(reservation);
                setSelectedReservationForDetails(null);
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showChangeRequest && reservationForChange && (
            <ChangeRequestModal
              reservation={reservationForChange}
              onClose={() => {
                setShowChangeRequest(false);
                setReservationForChange(null);
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showCancelRequest && reservationToCancel && (
            <CancelRequestModal
              reservation={reservationToCancel}
              onClose={() => {
                setShowCancelRequest(false);
                setReservationToCancel(null);
              }}
            />
          )}
        </AnimatePresence>

        <ConfirmationModal
          isOpen={showDeleteConfirm}
          title="Confirmar Eliminación"
          message="¿Estás seguro de que quieres eliminar esta reserva? Esta acción no se puede deshacer."
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </motion.div>
    </DndProvider>
  );
};

export default Reservations;
