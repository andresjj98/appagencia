import React from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, Phone, Eye } from 'lucide-react';

const ClientCard = ({ client, onSelect, index }) => {
  return (
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
        onClick={() => onSelect(client)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Eye className="w-5 h-5" /> Ver Reservas
      </motion.button>
    </motion.div>
  );
};

export default ClientCard;