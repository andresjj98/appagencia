import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, SortAsc } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ReservationCard from '../components/Reservations/ReservationCard';
import ReservationForm from '../components/Reservations/ReservationForm';
import ReservationTypeSelector from '../components/Reservations/ReservationTypeSelector';
import ReservationPostCreation from '../components/Reservations/ReservationPostCreation';
import ReservationSummary from '../components/Reservations/ReservationSummary';
import { mockReservations } from '../mock/reservations';

const Reservations = () => {
  const [reservations, setReservations] = useState(mockReservations);
  const [showForm, setShowForm] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showPostCreation, setShowPostCreation] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [newlyCreatedReservation, setNewlyCreatedReservation] = useState(null);
  const [selectedReservationType, setSelectedReservationType] = useState(null);
  const [reservationToConfirm, setReservationToConfirm] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

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
    setEditingReservation(reservation);
    setSelectedReservationType(reservation.isMultiDestination ? 'all_inclusive' : 'all_inclusive');
    setShowForm(true);
  };
  
    const handleFinalSaveReservation = (reservationData) => {
    if (editingReservation) {
      setReservations(prev =>
        prev.map(r => r.id === editingReservation.id ? reservationData : r)
      );
      setShowForm(false);
      setEditingReservation(null);
      setSelectedReservationType(null);
    } else {
      setReservations(prev => [reservationData, ...prev]);
      setNewlyCreatedReservation(reservationData);
      setShowForm(false);
      setShowPostCreation(true);
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
    setReservations(prev => 
      prev.map(r => r.id === updatedReservation.id ? updatedReservation : r)
    );
    setShowPostCreation(false);
    setNewlyCreatedReservation(null);
  };

  const handleDeleteReservation = (reservation) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta reserva?')) {
      setReservations(prev => prev.filter(r => r.id !== reservation.id));
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    if (filter === 'all') return true;
    return reservation.status === filter;
  });

  const sortedReservations = [...filteredReservations].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'departure':
        // Assuming departureDate exists for all reservations or handle multi-destination
        const dateA = a.isMultiDestination && a.multiDestinations.length > 0 
                      ? new Date(a.multiDestinations[0].departureDate) 
                      : new Date(a.departureDate);
        const dateB = b.isMultiDestination && b.multiDestinations.length > 0 
                      ? new Date(b.multiDestinations[0].departureDate) 
                      : new Date(b.departureDate);
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
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {sortedReservations.map((reservation, index) => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                index={index}
                onEdit={handleEditReservation}
                onDelete={handleDeleteReservation}
                onView={(reservation) => console.log('Ver reserva:', reservation)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {sortedReservations.length === 0 && (
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