import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, X, CheckCircle, Plane, Hotel, Ticket, HeartPulse, Bus } from 'lucide-react';
import ReservationForm from '../Reservations/ReservationForm';
import ReservationDetailContent from '../Reservations/ReservationDetailContent';

/**
 * Componente para gestionar reservas en el módulo de Gestión
 * Muestra vista de solo lectura con opción de editar y confirmar servicios
 */
const ReservationEditTab = ({ reservation, onUpdate, readOnly = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);

  // Si readOnly es true desde props, no permitir edición
  const canEdit = !readOnly;

  const showAlert = (title, message) => {
    setAlertInfo({ title, message });
    setTimeout(() => setAlertInfo(null), 3000);
  };

  const handleSave = async (updatedReservation) => {
    try {
      // Actualizar reserva a través del callback
      if (onUpdate) {
        await onUpdate(updatedReservation);
      }
      setIsEditing(false);
      showAlert('Éxito', 'Reserva actualizada correctamente');
    } catch (error) {
      console.error('Error updating reservation:', error);
      showAlert('Error', 'Error al actualizar la reserva');
    }
  };

  const handleConfirmService = async (serviceType, serviceId) => {
    setIsConfirming(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      // Llamar API para confirmar servicio
      const response = await fetch(`http://localhost:4000/api/reservations/${reservation.id}/confirm-service`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          serviceType,
          serviceId,
          confirmedBy: reservation.advisorId || reservation.advisor_id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al confirmar el servicio');
      }

      showAlert('Éxito', `${serviceType} confirmado exitosamente`);

      if (onUpdate) {
        await onUpdate();
      }
    } catch (error) {
      console.error('Error confirming service:', error);
      showAlert('Error', error.message);
    } finally {
      setIsConfirming(false);
    }
  };

  // Componente para botón de confirmar servicio
  const ConfirmServiceButton = ({ serviceType, serviceId, isConfirmed, icon: Icon, label }) => {
    if (isConfirmed) {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          Confirmado
        </div>
      );
    }

    return (
      <motion.button
        onClick={() => handleConfirmService(serviceType, serviceId)}
        disabled={isConfirming}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Icon className="w-4 h-4" />
        {isConfirming ? 'Confirmando...' : `Confirmar ${label}`}
      </motion.button>
    );
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

      {/* Header con botones de acción */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gestión de Reserva</h2>
          <p className="text-sm text-gray-500">
            {isEditing ? 'Modo edición - Realiza los cambios necesarios' : 'Vista de solo lectura - Haz clic en Editar para modificar'}
          </p>
        </div>

        {canEdit && (
          <div className="flex gap-2">
            {!isEditing ? (
              <motion.button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Edit className="w-4 h-4" />
                Editar Reserva
              </motion.button>
            ) : (
              <motion.button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <X className="w-4 h-4" />
                Cancelar Edición
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* Contenido: Vista de lectura o Formulario de edición */}
      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div
            key="read-only"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Vista de solo lectura con ReservationDetailContent */}
            <ReservationDetailContent reservation={reservation} showAlert={showAlert} />

            {/* Botones de Confirmar Servicio */}
            {canEdit && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar Servicios</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Vuelos */}
                  {reservation._original?.reservation_flights?.length > 0 && (
                    <ConfirmServiceButton
                      serviceType="flight"
                      serviceId={reservation._original.reservation_flights[0].id}
                      isConfirmed={reservation._original.flight_status_ok}
                      icon={Plane}
                      label="Vuelos"
                    />
                  )}

                  {/* Hoteles */}
                  {reservation._original?.reservation_hotels?.length > 0 && (
                    <ConfirmServiceButton
                      serviceType="hotel"
                      serviceId={reservation._original.reservation_hotels[0].id}
                      isConfirmed={reservation._original.hotel_status_ok}
                      icon={Hotel}
                      label="Hotel"
                    />
                  )}

                  {/* Tours */}
                  {reservation._original?.reservation_tours?.length > 0 && (
                    <ConfirmServiceButton
                      serviceType="tour"
                      serviceId={reservation._original.reservation_tours[0].id}
                      isConfirmed={reservation._original.tours_status_ok}
                      icon={Ticket}
                      label="Tours"
                    />
                  )}

                  {/* Asistencia Médica */}
                  {reservation._original?.reservation_medical_assistances?.length > 0 && (
                    <ConfirmServiceButton
                      serviceType="medical"
                      serviceId={reservation._original.reservation_medical_assistances[0].id}
                      isConfirmed={reservation._original.assistance_status_ok}
                      icon={HeartPulse}
                      label="Asistencia"
                    />
                  )}

                  {/* Traslados */}
                  {reservation._original?.reservation_transfers?.length > 0 && (
                    <ConfirmServiceButton
                      serviceType="transfer"
                      serviceId={reservation._original.reservation_transfers[0].id}
                      isConfirmed={reservation._original.transfer_status_ok}
                      icon={Bus}
                      label="Traslados"
                    />
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="edit-mode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Formulario de edición completo */}
            <ReservationForm
              reservation={reservation._original}
              reservationType={reservation._original?.reservation_type || 'all_inclusive'}
              onSave={handleSave}
              onClose={() => setIsEditing(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReservationEditTab;
