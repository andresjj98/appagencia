import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Phone, 
  Mail, 
  Edit, 
  Trash2,
  Eye
} from 'lucide-react';
import { formatCurrency, formatDate, calculateDays } from '../../utils/helpers';
import { RESERVATION_STATUS, PAYMENT_STATUS } from '../../utils/constants';

const ReservationCard = ({ reservation, index = 0, onEdit, onDelete, onView }) => {
  // Safely get status and payment configuration objects. If an unknown status
  // is provided we fall back to a neutral configuration to avoid runtime
  // errors accessing properties on `undefined`.
  const statusConfig =
    RESERVATION_STATUS[reservation?.status] || {
      label: reservation?.status || 'Desconocido',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800'
    };
  const paymentConfig =
    PAYMENT_STATUS[reservation?.paymentStatus] || {
      label: reservation?.paymentStatus || 'Desconocido',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800'
    };
  const tripDays = calculateDays(reservation.departureDate, reservation.returnDate);

  return (
    <motion.div
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.01 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-gray-900">{reservation.clientName}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
              {statusConfig.label}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${paymentConfig.bgColor} ${paymentConfig.textColor}`}>
              {paymentConfig.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 font-medium">{reservation.id}</p>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            onClick={() => onView?.(reservation)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Eye className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={() => onEdit?.(reservation)}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Edit className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={() => onDelete?.(reservation)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Destination */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
        <MapPin className="w-5 h-5 text-blue-600" />
        <div>
          <p className="font-semibold text-gray-900">{reservation.destination}</p>
          <p className="text-sm text-gray-600">{tripDays} días de viaje</p>
        </div>
      </div>

      {/* Trip Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Salida</p>
            <p className="text-sm font-medium text-gray-900">
              {formatDate(reservation.departureDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Regreso</p>
            <p className="text-sm font-medium text-gray-900">
              {formatDate(reservation.returnDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Contact & Passengers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <p className="text-sm text-gray-600 truncate">{reservation.clientEmail}</p>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-gray-400" />
          <p className="text-sm text-gray-600">{reservation.clientPhone}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {reservation.passengers} {reservation.passengers === 1 ? 'pasajero' : 'pasajeros'}
          </span>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(reservation.totalAmount)}
          </p>
          <p className="text-xs text-gray-500">
            Asesor: {reservation.advisorName}
          </p>
        </div>
      </div>

      {/* Notes */}
      {reservation.notes && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Notas:</span> {reservation.notes}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default ReservationCard;