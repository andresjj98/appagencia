import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Send } from 'lucide-react';
import { formatUserName } from '../../utils/nameFormatter';

const RejectReservationModal = ({ reservation, onReject, onClose }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    // Validar que se ingresó un motivo
    if (!reason.trim()) {
      setError('Debes ingresar un motivo de rechazo.');
      return;
    }

    if (reason.trim().length < 10) {
      setError('El motivo debe tener al menos 10 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onReject(reservation.id, reason.trim());
      onClose();
    } catch (err) {
      setError(err.message || 'Error al rechazar la reserva');
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Rechazar Reserva</h2>
                  <p className="text-red-100 text-sm mt-1">
                    Factura: {reservation.invoiceNumber || 'Sin asignar'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Info del Cliente */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Información de la Reserva</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Cliente:</span>
                  <span className="ml-2 font-medium text-gray-900">{reservation.clientName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Destino:</span>
                  <span className="ml-2 font-medium text-gray-900">{reservation.destinationSummary || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    ${parseFloat(reservation.totalAmount || 0).toLocaleString('es-CO')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Asesor:</span>
                  <span className="ml-2 font-medium text-gray-900">{formatUserName(reservation.advisorName) || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Campo de Motivo */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Motivo del Rechazo <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError('');
                }}
                placeholder="Explica detalladamente por qué se rechaza esta reserva. El asesor recibirá este mensaje."
                rows={5}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  error
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                disabled={isSubmitting}
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  Mínimo 10 caracteres. Este mensaje será visible para el asesor.
                </p>
                <p className="text-xs text-gray-400">
                  {reason.length}/500
                </p>
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 mt-2 flex items-center gap-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.p>
              )}
            </div>

            {/* Advertencia */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-yellow-800">Importante</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Al rechazar esta reserva, el asesor podrá ver el motivo y realizar las correcciones necesarias.
                    La reserva volverá a estado pendiente después de las correcciones.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
            <motion.button
              onClick={onClose}
              className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
            >
              Cancelar
            </motion.button>
            <motion.button
              onClick={handleSubmit}
              className={`px-5 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl'
              }`}
              whileHover={!isSubmitting ? { scale: 1.02 } : {}}
              whileTap={!isSubmitting ? { scale: 0.98 } : {}}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Rechazando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Rechazar Reserva
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RejectReservationModal;
