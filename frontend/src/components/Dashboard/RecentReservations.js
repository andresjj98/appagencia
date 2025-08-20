import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Euro } from 'lucide-react';
import { formatCurrency, formatShortDate } from '../../utils/helpers';
import { RESERVATION_STATUS } from '../../utils/constants';

const RecentReservations = ({ reservations = [] }) => {
  return (
    <motion.div
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Reservas Recientes</h3>
        <motion.button
          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          whileHover={{ scale: 1.05 }}
        >
          Ver todas
        </motion.button>
      </div>

      <div className="space-y-4">
        {reservations.slice(0, 5).map((reservation, index) => {
          const statusConfig = RESERVATION_STATUS[reservation.status];
          
          return (
            <motion.div
              key={reservation.id}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900 truncate">
                    {reservation.clientName}
                  </p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                    {statusConfig.label}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{reservation.destination}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatShortDate(reservation.departureDate)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{reservation.passengers}</span>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 text-right">
                <p className="font-bold text-gray-900">
                  {formatCurrency(reservation.totalAmount)}
                </p>
                <p className="text-sm text-gray-500">
                  {reservation.id}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default RecentReservations;