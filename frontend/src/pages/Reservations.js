import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, SortAsc } from 'lucide-react';
import ReservationSummary from '../components/Reservations/ReservationSummary';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ReservationCard from '../components/Reservations/ReservationCard';
import ReservationForm from '../components/Reservations/ReservationForm';
import ReservationTypeSelector from '../components/Reservations/ReservationTypeSelector';
import ReservationPostCreation from '../components/Reservations/ReservationPostCreation';
import ReservationFullDetail from '../components/Reservations/ReservationFullDetail';
import CancelRequestModal from '../components/Reservations/CancelRequestModal';

// The `ChangeRequestModal` component is incorrectly located in the `CancelRequestModal.js` file.
const ChangeRequestModal = CancelRequestModal;

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showPostCreation, setShowPostCreation] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [newlyCreatedReservation, setNewlyCreatedReservation] = useState(null);
  const [selectedReservationType, setSelectedReservationType] = useState(null);
  const [reservationToConfirm, setReservationToConfirm] = useState(false); // Changed to boolean
  const [showSummary, setShowSummary] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false); // New state
  const [selectedReservationForDetails, setSelectedReservationForDetails] = useState(null); // New state
  const [showChangeRequest, setShowChangeRequest] = useState(false);
  const [reservationForChange, setReservationForChange] = useState(null);
  const [showCancelRequest, setShowCancelRequest] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [isLoading, setIsLoading] = useState(true);

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

  const handleUpdateReservationDetails = (updatedReservation) => {
    // Here you would typically send the update to the backend
    console.log('Updating reservation details:', updatedReservation);
    // For now, just refetch all reservations to see changes
    fetchReservations();
    setShowDetailsModal(false);
  };

  const transformReservationData = (apiData) => {
    return apiData.map(res => {
      const firstSegment = res.reservation_segments && res.reservation_segments[0];
      const passengers = (res.passengers_adt || 0) + (res.passengers_chd || 0) + (res.passengers_inf || 0);

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
        paymentStatus: 'pending', // Placeholder
        advisorName: 'N/A', // Placeholder
        notes: res.notes,
        _original: res 
      };
    });
  };

  const fetchReservations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/reservations');
      const data = await response.json();
      if (response.ok) {
        const transformedData = transformReservationData(data);
        setReservations(transformedData);
      } else {
        console.error('Error fetching reservations:', data.message);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
        reservation._original.isMultiDestination ? 'all_inclusive' : 'all_inclusive'
      );
      setShowForm(true);
    } else {
      setReservationForChange(reservation._original);
      setShowChangeRequest(true);
    }
  };

  const handleFinalSaveReservation = async (reservationData) => {
    const url = editingReservation
      ? `http://localhost:4000/api/reservations/${editingReservation.id}`
      : 'http://localhost:4000/api/reservations';
    const method = editingReservation ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData),
      });

      const result = await response.json();

      if (response.ok) {
        setShowForm(false);
        setEditingReservation(null);
        setSelectedReservationType(null);
        fetchReservations(); // Refetch all reservations
        if (!editingReservation) {
            // This part needs adjustment as the full new reservation object is not returned
            // For now, just refetching is enough. A better approach would be to get the new reservation object from the backend.
            // setNewlyCreatedReservation(result); 
            // setShowPostCreation(true);
        }
      } else {
        console.error('Error saving reservation:', result.message);
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error saving reservation:', error);
      alert('An unexpected error occurred.');
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

  const handleUpdateReservationAfterPostCreation = (updatedReservation) => {
    fetchReservations();
    setShowPostCreation(false);
    setNewlyCreatedReservation(null);
  };

  const handleDeleteReservation = async (reservation) => {
    if (reservation.status !== 'confirmed') {
      if (window.confirm('¿Estás seguro de que quieres eliminar esta reserva?')) {
        try {
          const response = await fetch(`http://localhost:4000/api/reservations/${reservation.id}`, {
            method: 'DELETE',
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
        }      
      }
    } else {
      setReservationToCancel(reservation);
      setShowCancelRequest(true);
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
      <motion.div
        className="p-6 space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
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

        {/* Reservation Type Selector Modal */}
        <AnimatePresence>
          {showTypeSelector && (
            <ReservationTypeSelector 
              onSelectType={handleSelectReservationType} 
              onClose={() => setShowTypeSelector(false)} 
            />
          )}
        </AnimatePresence>

        {/* Reservation Form Modal */}
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

        {/* Reservation Summary Modal */}
        <AnimatePresence>
          {showSummary && reservationToConfirm && (
            <ReservationSummary
              reservation={reservationToConfirm}
              onConfirm={handleConfirmReservation}
              onCancel={handleCancelSummary}
            />
          )}
        </AnimatePresence>

        {/* Reservation Details Modal */}
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

        {/* Change Request Modal */}
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

        {/* Cancel Request Modal */}
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

        {/* Post-Creation Screen Modal */}
        <AnimatePresence>
          {showPostCreation && newlyCreatedReservation && (
            <ReservationPostCreation
              reservation={newlyCreatedReservation}
              onUpdateReservation={handleUpdateReservationAfterPostCreation}
              onClose={() => setShowPostCreation(false)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </DndProvider>
  );
};

export default Reservations;