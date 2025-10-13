import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, X } from 'lucide-react';
import ReservationForm from '../Reservations/ReservationForm';
import ReservationDetailContent from '../Reservations/ReservationDetailContent';

/**
 * Pestaña de Información General con capacidad de edición
 */
const InfoWithEditTab = ({ reservation, onUpdate, readOnly = false, editingSection = null, onClearSection }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);

  const canEdit = !readOnly;

  // Si hay una sección específica para editar, activar modo edición automáticamente
  React.useEffect(() => {
    if (editingSection && !isEditing) {
      setIsEditing(true);
    }
  }, [editingSection]);

  const showAlert = (title, message) => {
    setAlertInfo({ title, message });
    setTimeout(() => setAlertInfo(null), 3000);
  };

  const handleSave = async (updatedReservation) => {
    try {
      // Validar que tengamos el ID de la reserva
      const reservationId = reservation?.id || reservation?._original?.id;
      if (!reservationId) {
        throw new Error('No se encontró el ID de la reserva');
      }

      // Limpiar undefined, null y strings vacías de forma recursiva
      const cleanPayload = (obj) => {
        if (Array.isArray(obj)) {
          return obj.map(item => cleanPayload(item)).filter(item => item !== null && item !== undefined);
        }

        if (obj !== null && typeof obj === 'object') {
          const cleaned = {};
          for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined && value !== null && value !== '' && value !== 'undefined') {
              cleaned[key] = cleanPayload(value);
            }
          }
          return cleaned;
        }

        return obj;
      };

      const cleanedReservation = cleanPayload(updatedReservation);

      // ⚠️ IMPORTANTE: Eliminar installments del payload para preservar estados de pago
      // Las cuotas solo deben actualizarse desde el módulo de Finanzas
      if (cleanedReservation.installments) {
        delete cleanedReservation.installments;
      }
      if (cleanedReservation.reservation_installments) {
        delete cleanedReservation.reservation_installments;
      }

      // Los transfers se envían normalmente (checkboxes: { hasIn, hasOut })
      // El backend los procesa correctamente ahora

      console.log('Enviando actualización de reserva:', {
        reservationId,
        payload: cleanedReservation
      });

      cleanedReservation.updateContext = cleanedReservation.updateContext || 'general';

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const response = await fetch(`http://localhost:4000/api/reservations/${reservationId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(cleanedReservation)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar la reserva');
      }

      setIsEditing(false);

      // Limpiar la sección editada
      if (onClearSection) {
        onClearSection();
      }

      showAlert('Éxito', 'Reserva actualizada correctamente');

      // Refrescar datos si hay callback
      if (onUpdate) {
        await onUpdate();
      }
    } catch (error) {
      console.error('Error updating reservation:', error);
      showAlert('Error', error.message || 'Error al actualizar la reserva');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (onClearSection) {
      onClearSection();
    }
  };

  return (
    <div className="space-y-4">
      {/* Alertas */}
      {alertInfo && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-blue-100 border border-blue-300 rounded-lg p-4"
        >
          <h4 className="font-semibold text-blue-900">{alertInfo.title}</h4>
          <p className="text-blue-700">{alertInfo.message}</p>
        </motion.div>
      )}

      {/* Header con botón de editar */}
      {canEdit && !isEditing && (
        <div className="flex justify-end">
          <motion.button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Edit className="w-4 h-4" />
            Editar Reserva
          </motion.button>
        </div>
      )}

      {/* Contenido */}
      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div
            key="read-only"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ReservationDetailContent reservation={reservation} showAlert={showAlert} />
          </motion.div>
        ) : (
          <motion.div
            key="edit-mode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Header en modo edición */}
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <div>
                <h3 className="font-semibold text-amber-900">Modo Edición</h3>
                <p className="text-sm text-amber-700">
                  {editingSection
                    ? `Editando sección: ${editingSection}`
                    : 'Realiza los cambios necesarios y guarda'}
                </p>
              </div>
              <motion.button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <X className="w-4 h-4" />
                Cancelar
              </motion.button>
            </div>

            {/* Formulario de edición */}
            <ReservationForm
              reservation={reservation._original}
              reservationType={reservation._original?.reservation_type || 'all_inclusive'}
              onSave={handleSave}
              onClose={handleCancel}
              focusSection={editingSection}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InfoWithEditTab;
