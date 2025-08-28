import React from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';

const ReservationSummary = ({ reservation, onConfirm, onCancel }) => {
  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Resumen de la Reserva</h2>
          <motion.button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <p className="font-medium">
              Esta reserva será creada y enviada para que sea procesada; aún no está confirmada.
            </p>
          </div>

          <div className="space-y-2">
            <p><span className="font-semibold">Cliente:</span> {reservation.clientName}</p>
            <p><span className="font-semibold">Email:</span> {reservation.clientEmail}</p>
            <p><span className="font-semibold">Teléfono:</span> {reservation.clientPhone}</p>
            <div>
              <p className="font-semibold mb-1">Segmentos:</p>
              {reservation.segments.map((seg, idx) => (
                <p key={idx} className="text-sm text-gray-700">
                  {seg.origin} &rarr; {seg.destination} ({formatDate(seg.departureDate)} - {formatDate(seg.returnDate)})
                </p>
              ))}
            </div>
            <p>
              <span className="font-semibold">Pasajeros:</span> ADT {reservation.passengersADT}, CHD {reservation.passengersCHD}, INF {reservation.passengersINF}
            </p>
            <p><span className="font-semibold">Total:</span> {formatCurrency(reservation.totalAmount)}</p>
            {reservation.notes && (
              <p><span className="font-semibold">Notas:</span> {reservation.notes}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <motion.button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Volver
            </motion.button>
            <motion.button
              onClick={onConfirm}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Reconfirmar
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReservationSummary;