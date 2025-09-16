import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader, Hotel, Plane, Sun, HeartPulse } from 'lucide-react';
import { useAuth } from '../../pages/AuthContext';

const FulfillmentChecklist = ({ reservation, onUpdate }) => {
  const [loadingItem, setLoadingItem] = useState(null);
  const { currentUser } = useAuth();

  const handleUpdateStatus = async (field) => {
    setLoadingItem(field);
    try {
      const response = await fetch(`http://localhost:4000/api/reservations/${reservation.id}/update-fulfillment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value: true, userRole: currentUser.role }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el estado');
      }
      // Notify parent to refetch data
      onUpdate();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoadingItem(null);
    }
  };

  const services = [
    {
      id: 'hotel',
      label: 'Hoteles',
      icon: Hotel,
      isPresent: reservation.reservation_hotels?.length > 0,
      isOk: reservation.hotel_status_ok,
      field: 'hotel_status_ok',
    },
    {
      id: 'flight',
      label: 'Vuelos',
      icon: Plane,
      isPresent: reservation.reservation_flights?.length > 0,
      isOk: reservation.flight_status_ok,
      field: 'flight_status_ok',
    },
    {
      id: 'tour',
      label: 'Tours',
      icon: Sun,
      isPresent: reservation.reservation_tours?.length > 0,
      isOk: reservation.tours_status_ok,
      field: 'tours_status_ok',
    },
    {
      id: 'assistance',
      label: 'Asistencias Médicas',
      icon: HeartPulse,
      isPresent: reservation.reservation_medical_assistances?.length > 0,
      isOk: reservation.assistance_status_ok,
      field: 'assistance_status_ok',
    },
  ];

  const presentServices = services.filter(s => s.isPresent);

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Checklist de Cumplimiento</h3>
      {presentServices.length > 0 ? (
        <div className="space-y-4">
          {presentServices.map(service => (
            <div key={service.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3">
                <service.icon className="w-6 h-6 text-gray-500" />
                <span className="font-semibold text-gray-700">{service.label}</span>
              </div>
              {service.isOk ? (
                <div className="flex items-center gap-2 text-green-600 font-semibold">
                  <Check className="w-5 h-5" /> Gestionado
                </div>
              ) : (
                <motion.button
                  onClick={() => handleUpdateStatus(service.field)}
                  disabled={loadingItem === service.field}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:bg-gray-400"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {loadingItem === service.field ? <Loader className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  Marcar como Gestionado
                </motion.button>
              )}
            </div>
          ))}
        </div>
      ) : <p className="text-gray-500">No hay servicios principales (vuelos, hoteles, etc.) en esta reserva para gestionar.</p>}
    </div>
  );
};

export default FulfillmentChecklist;