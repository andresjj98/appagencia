import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Plane, Hotel, Ticket, HeartPulse, Bus, Clock, MapPin, Users, Calendar, Edit } from 'lucide-react';

/**
 * Pestaña para confirmar servicios de la reserva
 * Muestra detalles completos de cada servicio con botón de confirmación
 */
const ServiceConfirmationTab = ({ reservation, onUpdate, onEditSection, readOnly = false }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);

  const showAlert = (title, message) => {
    setAlertInfo({ title, message });
    setTimeout(() => setAlertInfo(null), 3000);
  };

  const handleConfirmService = async (serviceType, serviceId) => {
    setIsConfirming(true);
    try {
      const response = await fetch(`http://localhost:4000/api/reservations/${reservation.id}/confirm-service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Componente de botón de confirmación
  const ConfirmButton = ({ serviceType, serviceId, isConfirmed }) => {
    if (isConfirmed) {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
          <CheckCircle className="w-5 h-5" />
          Servicio Confirmado
        </div>
      );
    }

    if (readOnly) {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg font-medium">
          Pendiente de Confirmación
        </div>
      );
    }

    return (
      <motion.button
        onClick={() => handleConfirmService(serviceType, serviceId)}
        disabled={isConfirming}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <CheckCircle className="w-5 h-5" />
        {isConfirming ? 'Confirmando...' : 'Confirmar Servicio'}
      </motion.button>
    );
  };

  // Componente para card de servicio
  const ServiceCard = ({ title, icon: Icon, isConfirmed, children, serviceType, serviceId, sectionName }) => (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      <div className={`px-6 py-4 flex items-center justify-between ${isConfirmed ? 'bg-green-50 border-b border-green-100' : 'bg-blue-50 border-b border-blue-100'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isConfirmed ? 'bg-green-100' : 'bg-blue-100'}`}>
            <Icon className={`w-6 h-6 ${isConfirmed ? 'text-green-600' : 'text-blue-600'}`} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center gap-3">
          {!readOnly && onEditSection && (
            <motion.button
              onClick={() => onEditSection(sectionName)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Edit className="w-4 h-4" />
              Editar
            </motion.button>
          )}
          <ConfirmButton serviceType={serviceType} serviceId={serviceId} isConfirmed={isConfirmed} />
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );

  const flights = reservation._original?.reservation_flights || [];
  const hotels = reservation._original?.reservation_hotels || [];
  const tours = reservation._original?.reservation_tours || [];
  const medicalAssistances = reservation._original?.reservation_medical_assistances || [];
  const transfers = reservation._original?.reservation_transfers || [];

  return (
    <div className="space-y-6">
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

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Confirmación de Servicios</h2>
        <p className="text-gray-600">Revisa y confirma cada servicio contratado para esta reserva</p>
      </div>

      {/* Vuelos */}
      {flights.length > 0 && flights.map((flight, index) => (
        <ServiceCard
          key={flight.id || index}
          title={`Vuelo - ${flight.airline || 'Aerolínea'}`}
          icon={Plane}
          isConfirmed={reservation._original.flight_status_ok}
          serviceType="flight"
          serviceId={flight.id}
          sectionName="flights"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">PNR / Código de Reserva</p>
              <p className="text-lg font-semibold text-gray-900">{flight.pnr || flight.tracking_code || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Categoría de Vuelo</p>
              <p className="text-lg font-semibold text-gray-900">{flight.flight_category || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Equipaje Permitido</p>
              <p className="text-lg font-semibold text-gray-900">{flight.baggage_allowance || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Ciclo de Vuelo</p>
              <p className="text-lg font-semibold text-gray-900">{flight.flight_cycle || 'N/A'}</p>
            </div>
          </div>

          {/* Itinerarios */}
          {flight.reservation_flight_itineraries && flight.reservation_flight_itineraries.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Itinerarios
              </h4>
              <div className="space-y-3">
                {flight.reservation_flight_itineraries.map((itinerary, idx) => (
                  <div key={itinerary.id || idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Número de Vuelo</p>
                        <p className="font-semibold text-gray-900">{itinerary.flight_number || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Salida</p>
                        <p className="font-semibold text-gray-900">{formatDateTime(itinerary.departure_time)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Llegada</p>
                        <p className="font-semibold text-gray-900">{formatDateTime(itinerary.arrival_time)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ServiceCard>
      ))}

      {/* Hoteles */}
      {hotels.length > 0 && hotels.map((hotel, index) => (
        <ServiceCard
          key={hotel.id || index}
          title={`Hotel - ${hotel.name || 'Sin nombre'}`}
          icon={Hotel}
          isConfirmed={reservation._original.hotel_status_ok}
          serviceType="hotel"
          serviceId={hotel.id}
          sectionName="hotels"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Categoría de Habitación</p>
              <p className="text-lg font-semibold text-gray-900">{hotel.room_category || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Plan de Alimentación</p>
              <p className="text-lg font-semibold text-gray-900">{hotel.meal_plan || 'N/A'}</p>
            </div>
          </div>

          {/* Acomodación */}
          {hotel.reservation_hotel_accommodations && hotel.reservation_hotel_accommodations.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Acomodación
              </h4>
              <div className="space-y-2">
                {hotel.reservation_hotel_accommodations.map((acc, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">{acc.rooms || 1}</span> habitación(es) -
                      <span className="font-semibold ml-1">{acc.adt || 0}</span> adultos,
                      <span className="font-semibold ml-1">{acc.chd || 0}</span> niños,
                      <span className="font-semibold ml-1">{acc.inf || 0}</span> infantes
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inclusiones */}
          {hotel.reservation_hotel_inclusions && hotel.reservation_hotel_inclusions.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Inclusiones</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {hotel.reservation_hotel_inclusions.map((inc, idx) => {
                  // Manejar tanto objetos como strings
                  const inclusionText = typeof inc === 'string' ? inc : (inc?.inclusion || 'Sin especificar');
                  return <li key={idx}>{inclusionText}</li>;
                })}
              </ul>
            </div>
          )}
        </ServiceCard>
      ))}

      {/* Tours */}
      {tours.length > 0 && tours.map((tour, index) => (
        <ServiceCard
          key={tour.id || index}
          title={`Tour - ${tour.name || 'Sin nombre'}`}
          icon={Ticket}
          isConfirmed={reservation._original.tours_status_ok}
          sectionName="tours"
          serviceType="tour"
          serviceId={tour.id}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Fecha</p>
              <p className="text-lg font-semibold text-gray-900">{formatDate(tour.date)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Costo</p>
              <p className="text-lg font-semibold text-gray-900">
                ${Number(tour.cost || 0).toLocaleString('es-CO')}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-500 font-medium mb-1">Incluir en Costo Total</p>
              <p className="text-lg font-semibold text-gray-900">
                {tour.include_cost ? 'Sí' : 'No'}
              </p>
            </div>
          </div>
        </ServiceCard>
      ))}

      {/* Asistencia Médica */}
      {medicalAssistances.length > 0 && medicalAssistances.map((assist, index) => (
        <ServiceCard
          key={assist.id || index}
          title="Asistencia Médica"
          icon={HeartPulse}
          isConfirmed={reservation._original.assistance_status_ok}
          sectionName="medicalAssistance"
          serviceType="medical"
          serviceId={assist.id}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Tipo de Plan</p>
              <p className="text-lg font-semibold text-gray-900">{assist.plan_type || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Fecha de Inicio</p>
              <p className="text-lg font-semibold text-gray-900">{formatDate(assist.start_date)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Fecha de Fin</p>
              <p className="text-lg font-semibold text-gray-900">{formatDate(assist.end_date)}</p>
            </div>
          </div>
        </ServiceCard>
      ))}

      {/* Traslados */}
      {transfers.length > 0 && transfers.map((transfer, index) => (
        <ServiceCard
          key={transfer.id || index}
          title={`Traslado - ${transfer.transfer_type || 'Sin especificar'}`}
          icon={Bus}
          isConfirmed={reservation._original.transfer_status_ok}
          sectionName="transfers"
          serviceType="transfer"
          serviceId={transfer.id}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Tipo de Transporte</p>
              <p className="text-lg font-semibold text-gray-900">{transfer.vehicle_type || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Origen</p>
              <p className="text-lg font-semibold text-gray-900">{transfer.pickup_location || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Destino</p>
              <p className="text-lg font-semibold text-gray-900">{transfer.dropoff_location || 'N/A'}</p>
            </div>
            {transfer.pickup_time && (
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Hora de Recogida</p>
                <p className="text-lg font-semibold text-gray-900">{formatDateTime(transfer.pickup_time)}</p>
              </div>
            )}
          </div>
        </ServiceCard>
      ))}

      {/* Mensaje si no hay servicios */}
      {flights.length === 0 && hotels.length === 0 && tours.length === 0 &&
       medicalAssistances.length === 0 && transfers.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500 text-lg">No hay servicios registrados para esta reserva</p>
        </div>
      )}
    </div>
  );
};

export default ServiceConfirmationTab;
