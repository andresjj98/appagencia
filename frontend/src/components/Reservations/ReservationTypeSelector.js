import React from 'react';
import { motion } from 'framer-motion';
import { 
  Plane, 
  Hotel, 
  Globe, 
  Briefcase, 
  HeartPulse, 
  Ticket,
  X
} from 'lucide-react';

const ReservationTypeSelector = ({ onSelectType, onClose }) => {
  const types = [
    { id: 'all_inclusive', label: 'Paquete Todo Incluido', icon: Globe, description: 'Vuelos, hotel, traslados, etc.' },
    { id: 'flights_only', label: 'Solo Vuelos', icon: Plane, description: 'Compra de tiquetes aéreos.' },
    { id: 'hotel_only', label: 'Solo Hotel', icon: Hotel, description: 'Reserva de alojamiento.' },
    { id: 'tours_only', label: 'Solo Tours', icon: Ticket, description: 'Excursiones y actividades.' },
    { id: 'medical_assistance', label: 'Asistencia Médica', icon: HeartPulse, description: 'Seguros de viaje y asistencia.' },
    { id: 'other', label: 'Otro Tipo de Reserva', icon: Briefcase, description: 'Servicios no listados.' },
  ];

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-3xl relative"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-6 h-6" />
        </motion.button>

        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Selecciona el Tipo de Reserva
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {types.map((type) => {
            const Icon = type.icon;
            return (
              <motion.button
                key={type.id}
                onClick={() => onSelectType(type.id)}
                className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group"
                whileHover={{ scale: 1.03, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:from-blue-500 group-hover:to-purple-600 transition-all duration-200">
                  <Icon className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors duration-200" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-800">
                  {type.label}
                </h3>
                <p className="text-sm text-gray-500 group-hover:text-gray-700">
                  {type.description}
                </p>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReservationTypeSelector;