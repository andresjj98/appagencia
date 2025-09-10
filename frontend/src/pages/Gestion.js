import React, { useState, useEffect } from 'react';
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
  ArrowLeft, // Import ArrowLeft
  Euro, // Import Euro
  Users // Import Users
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';
import { RESERVATION_STATUS } from '../utils/constants';
import ReservationDetail from '../components/Reservations/ReservationDetail';
const Gestion = () => {
  const [reservations, setReservations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReservation, setSelectedReservation] = useState(null);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/reservations');
        const data = await response.json();
        setReservations(data);
      } catch (error) {
        console.error('Error fetching reservations:', error);
      }
    };
    fetchReservations();
  }, []);

  const filteredReservations = reservations.filter(reservation => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const clientName = reservation.clientName || '';
    const destination = reservation.destination || '';
    const invoice = reservation.invoiceNumber ? reservation.invoiceNumber.toString() : '';
    return (
      clientName.toLowerCase().includes(lowerCaseSearchTerm) ||
      destination.toLowerCase().includes(lowerCaseSearchTerm) ||
      invoice.includes(lowerCaseSearchTerm)
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
    setSelectedReservation(reservation);
  };

  const handleBackToList = () => {
    setSelectedReservation(null);
  };

  const handleApprove = async (reservationId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/reservations/${reservationId}/approve`, { method: 'POST' });
      if (!response.ok) throw new Error('Error approving reservation');
      const updatedReservation = await response.json();
      setReservations(prev => prev.map(res => res.id === reservationId ? { ...res, ...updatedReservation } : res));
    } catch (error) {
      console.error('Error approving reservation:', error);
    }
  };

  const handleReject = async (reservationId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/reservations/${reservationId}/reject`, { method: 'POST' });
      if (!response.ok) throw new Error('Error rejecting reservation');
      const updatedReservation = await response.json();
      setReservations(prev => prev.map(res => res.id === reservationId ? { ...res, ...updatedReservation } : res));
    } catch (error) {
      console.error('Error rejecting reservation:', error);
    }
  };

  const handleUpdateReservation = (updatedReservation) => {
    setReservations(prev =>
      prev.map(res => (res.id === updatedReservation.id ? updatedReservation : res))
    );
    setSelectedReservation(updatedReservation);
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
                sortedReservations.map((reservation, index) => (
                  <motion.div
                    key={reservation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{reservation.destination}</h3>
                        {reservation.invoiceNumber && (
                          <p className="text-sm text-gray-500">Factura: {reservation.invoiceNumber}</p>
                        )}
                        {!reservation.invoiceNumber && (
                          <p className="text-sm text-gray-500">ID: {reservation.id}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${RESERVATION_STATUS[reservation.status]?.bgColor} ${RESERVATION_STATUS[reservation.status]?.textColor}`}>
                          {RESERVATION_STATUS[reservation.status]?.label}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <p className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" /> {reservation.clientName}
                      </p>
                      <p className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" /> Salida: {formatDate(reservation.departureDate)}
                      </p>
                      <p className="flex items-center gap-2">
                        <Euro className="w-4 h-4 text-gray-400" /> Total: {formatCurrency(reservation.totalAmount)}
                      </p>
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-4">
                      {reservation.status === 'pending' && (
                        <>
                          <motion.button
                            onClick={() => handleApprove(reservation.id)}
                            className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Aprobar
                          </motion.button>
                          <motion.button
                            onClick={() => handleReject(reservation.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Rechazar
                          </motion.button>
                        </>
                      )}
                      <motion.button
                        onClick={() => handleViewReservationDetail(reservation)}
                        className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Ver Detalles
                      </motion.button>
                    </div>
                  </motion.div>
                ))
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
        <ReservationDetail 
          reservation={selectedReservation} 
          onBack={handleBackToList} 
          onUpdateReservation={handleUpdateReservation}
        />
      )}
    </motion.div>
  );
};

export default Gestion;