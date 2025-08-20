import React, { useState } from 'react';
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
import { mockReservations } from '../mock/reservations'; 
import { formatCurrency, formatDate } from '../utils/helpers';
import { RESERVATION_STATUS, PAYMENT_STATUS } from '../utils/constants';
import ClientReservationDetail from '../components/Clients/ClientReservationDetail'; 

// Group reservations by client
const getClientsWithReservations = (reservations) => {
  const clientsMap = new Map();
  reservations.forEach(res => {
    if (!clientsMap.has(res.clientEmail)) {
      clientsMap.set(res.clientEmail, {
        id: res.clientEmail, // Using email as client ID for mock
        name: res.clientName,
        email: res.clientEmail,
        phone: res.clientPhone,
        reservations: []
      });
    }
    clientsMap.get(res.clientEmail).reservations.push(res);
  });
  return Array.from(clientsMap.values());
};

const ClientManagement = () => {
  const [clients, setClients] = useState(getClientsWithReservations(mockReservations));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const filteredClients = clients.filter(client => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      client.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      client.email.toLowerCase().includes(lowerCaseSearchTerm) ||
      client.phone.toLowerCase().includes(lowerCaseSearchTerm) ||
      client.reservations.some(res => res.destination.toLowerCase().includes(lowerCaseSearchTerm))
    );
  });

  const handleViewClientReservations = (client) => {
    setSelectedClient(client);
    setSelectedReservation(null); // Clear selected reservation when viewing client
  };

  const handleViewReservationDetail = (reservation) => {
    setSelectedReservation(reservation);
  };

  const handleBackToClientReservations = () => {
    setSelectedReservation(null);
  };

  const handleBackToClientList = () => {
    setSelectedClient(null);
    setSelectedReservation(null);
  };

  // Placeholder for updating reservation (e.g., after form submission in detail view)
  const handleUpdateReservation = (updatedReservation) => {
    const updatedClients = clients.map(client => {
      if (client.id === selectedClient.id) {
        return {
          ...client,
          reservations: client.reservations.map(res => 
            res.id === updatedReservation.id ? updatedReservation : res
          )
        };
      }
      return client;
    });
    setClients(updatedClients);
    setSelectedReservation(updatedReservation); // Update the displayed reservation
  };

  return (
    <motion.div
      className="p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {!selectedClient && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h2>
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
              {filteredClients.length > 0 ? (
                filteredClients.map((client, index) => (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{client.name}</h3>
                        <p className="text-sm text-gray-500">{client.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" /> {client.phone}
                      </p>
                      <p className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" /> Reservas: {client.reservations.length}
                      </p>
                    </div>
                    <motion.button
                      onClick={() => handleViewClientReservations(client)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Eye className="w-5 h-5" /> Ver Reservas
                    </motion.button>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="col-span-full text-center py-12 text-gray-500 text-lg"
                >
                  No se encontraron clientes.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {selectedClient && !selectedReservation && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Reservas de {selectedClient.name}</h2>
            <motion.button
              onClick={handleBackToClientList}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowLeft className="w-5 h-5" /> Volver a Clientes
            </motion.button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence>
              {selectedClient.reservations.length > 0 ? (
                selectedClient.reservations.map((res, index) => {
                  const statusConfig = RESERVATION_STATUS[res.status];
                  const paymentConfig = PAYMENT_STATUS[res.paymentStatus];
                  return (
                    <motion.div
                      key={res.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900">{res.destination}</h3>
                          <p className="text-sm text-gray-500">ID: {res.id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                            {statusConfig.label}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentConfig.bgColor} ${paymentConfig.textColor}`}>
                            {paymentConfig.label}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" /> Salida: {formatDate(res.departureDate)}
                        </p>
                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" /> Regreso: {formatDate(res.returnDate)}
                        </p>
                        <p className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" /> Pasajeros: {res.passengers}
                        </p>
                        <p className="flex items-center gap-2">
                          <Euro className="w-4 h-4 text-gray-400" /> Total: {formatCurrency(res.totalAmount)}
                        </p>
                      </div>
                      <motion.button
                        onClick={() => handleViewReservationDetail(res)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Eye className="w-5 h-5" /> Ver Detalles
                      </motion.button>
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
                  Este cliente no tiene reservas.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {selectedReservation && (
        <ClientReservationDetail 
          reservation={selectedReservation} 
          onBack={handleBackToClientReservations} 
          onUpdateReservation={handleUpdateReservation}
        />
      )}
    </motion.div>
  );
};

export default ClientManagement;