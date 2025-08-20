import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, SortAsc } from 'lucide-react';
import ReservationCard from '../components/Reservations/ReservationCard';
import ReservationForm from '../components/Reservations/ReservationForm';
import ReservationTypeSelector from '../components/Reservations/ReservationTypeSelector'; // Import the new component
import { mockReservations } from '../mock/reservations';

const Reservations = () => {
  const [reservations, setReservations] = useState(mockReservations);
  const [showForm, setShowForm] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false); // State for type selector
  const [editingReservation, setEditingReservation] = useState(null);
  const [selectedReservationType, setSelectedReservationType] = useState(null); // State for selected type
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const handleNewReservationClick = () => {
    setEditingReservation(null);
    setShowTypeSelector(true); // Show type selector first
  };

  const handleSelectReservationType = (type) => {
    setSelectedReservationType(type);
    setShowTypeSelector(false); // Hide type selector
    setShowForm(true); // Show the form
  };

  const handleEditReservation = (reservation) => {
    setEditingReservation(reservation);
    // Determine type based on existing reservation data if needed, or default to 'all_inclusive'
    setSelectedReservationType(reservation.isMultiDestination ? 'all_inclusive' : 'all_inclusive'); // Simplified for now
    setShowForm(true);
  };

  const handleSaveReservation = (reservationData) => {
    if (editingReservation) {
      setReservations(prev => 
        prev.map(r => r.id === editingReservation.id ? reservationData : r)
      );
    } else {
      setReservations(prev => [reservationData, ...prev]);
    }
    setShowForm(false);
    setEditingReservation(null);
    setSelectedReservationType(null); // Reset selected type
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
        return new Date(a.departureDate) - new Date(b.departureDate);
      case 'amount':
        return b.totalAmount - a.totalAmount;
      default:
        return 0;
    }
  });

  return (
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
          onClick={handleNewReservationClick} // Changed to show type selector
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
            reservationType={selectedReservationType} // Pass the selected type
            onSave={handleSaveReservation}
            onClose={() => {
              setShowForm(false);
              setEditingReservation(null);
              setSelectedReservationType(null); // Reset selected type
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Reservations;