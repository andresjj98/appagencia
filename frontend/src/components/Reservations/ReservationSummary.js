import React from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import { useSettings } from '../../utils/SettingsContext';

const ReservationSummary = ({ reservation, onConfirm, onCancel }) => {
  const { formatCurrency, formatDate } = useSettings();

  // Defensive check in case reservation data is not passed correctly.
  if (!reservation) {
    return null; // Or a loading/error state
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">Detalles de la Reserva</h2>
          <motion.button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            whileHover={{ scale: 1.1 }}
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          {/* Warning Message */}
          <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
            <div>
                <h4 className="font-bold text-yellow-800">Atención</h4>
                <p className="text-sm text-yellow-700">La reserva será enviada para ser procesada. Por favor, verifique que toda la información sea correcta antes de confirmar.</p>
            </div>
          </div>

          {/* Datos del Titular */}
          <section className="space-y-1">
            <h3 className="text-lg font-semibold">Datos del Titular</h3>
            <p><span className="font-semibold">Nombre:</span> {reservation.clientName}</p>
            {reservation.clientId && <p><span className="font-semibold">Identificación:</span> {reservation.clientId}</p>}
            <p><span className="font-semibold">Email:</span> {reservation.clientEmail}</p>
            <p><span className="font-semibold">Teléfono:</span> {reservation.clientPhone}</p>
            {reservation.clientAddress && <p><span className="font-semibold">Dirección:</span> {reservation.clientAddress}</p>}
            {reservation.emergencyContact && (reservation.emergencyContact.name || reservation.emergencyContact.phone) && (
              <p><span className="font-semibold">Contacto de Emergencia:</span> {reservation.emergencyContact.name} {reservation.emergencyContact.phone && `(${reservation.emergencyContact.phone})`}</p>
            )}
          </section>

          {/* Itinerario */}
          <section>
            <h3 className="text-lg font-semibold mb-1">Itinerario</h3>
            {(reservation.segments || []).map((seg, idx) => (
              <p key={idx} className="text-sm text-gray-700">
                {seg.origin} &rarr; {seg.destination} ({formatDate(seg.departureDate)} - {formatDate(seg.returnDate)})
              </p>
            ))}
          </section>

          {/* Pasajeros */}
          <section>
            <h3 className="text-lg font-semibold mb-1">Pasajeros</h3>
            <p>Adultos: {reservation.passengersADT}</p>
            <p>Niños: {reservation.passengersCHD}</p>
            <p>Infantes: {reservation.passengersINF}</p>
          </section>

          {/* Vuelos */}
          {reservation.flights && reservation.flights.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-1">Vuelos</h3>
              {(reservation.flights || []).map((flight, idx) => (
                <div key={idx} className="mb-2 text-sm text-gray-700">
                  <p><span className="font-medium">Aerolínea:</span> {flight.airline}</p>
                  {flight.flightCategory && <p><span className="font-medium">Categoría:</span> {flight.flightCategory}</p>}
                  {flight.baggageAllowance && <p><span className="font-medium">Equipaje:</span> {flight.baggageAllowance}</p>}
                  {(flight.itineraries || []).map((it, i) => (
                    <p key={i} className="pl-4">Vuelo {it.flightNumber} - {it.departureTime} - {it.arrivalTime}</p>
                  ))}
                </div>
              ))}
            </section>
          )}

          {/* Hoteles */}
          {reservation.hotels && reservation.hotels.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-1">Hoteles</h3>
              {(reservation.hotels || []).map((hotel, idx) => (
                <div key={idx} className="mb-2 text-sm text-gray-700">
                  <p><span className="font-medium">Nombre:</span> {hotel.name}</p>
                  {hotel.roomCategory && <p><span className="font-medium">Categoría de Habitación:</span> {hotel.roomCategory}</p>}
                  {hotel.mealPlan && <p><span className="font-medium">Plan de Comidas:</span> {hotel.mealPlan}</p>}
                  {hotel.accommodation && (hotel.accommodation || []).map((acc, i) => (
                    <p key={i} className="pl-4">Habitaciones: {acc.rooms}, ADT {acc.adt}, CHD {acc.chd}, INF {acc.inf}</p>
                  ))}
                  {hotel.hotelInclusions && hotel.hotelInclusions.length > 0 && (
                    <ul className="pl-6 list-disc">
                      {(hotel.hotelInclusions || []).map((inc, i) => (
                        <li key={i}>{inc}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Tours */}
          {reservation.tours && reservation.tours.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-1">Tours</h3>
              {(reservation.tours || []).map((tour, idx) => (
                <p key={idx} className="text-sm text-gray-700">{tour.name} - {formatDate(tour.date)} ({formatCurrency(tour.cost)})</p>
              ))}
            </section>
          )}

          {/* Asistencias Médicas */}
          {reservation.medicalAssistances && reservation.medicalAssistances.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-1">Asistencias Médicas</h3>
              {(reservation.medicalAssistances || []).map((med, idx) => (
                <p key={idx} className="text-sm text-gray-700">{med.planType} ({formatDate(med.startDate)} - {formatDate(med.endDate)})</p>
              ))}
            </section>
          )}

          {/* Pago */}
          <section>
            <h3 className="text-lg font-semibold mb-1">Pago</h3>
            <p>Precio ADT: {formatCurrency(reservation.pricePerADT)}</p>
            <p>Precio CHD: {formatCurrency(reservation.pricePerCHD)}</p>
            <p>Precio INF: {formatCurrency(reservation.pricePerINF)}</p>
            <p className="font-bold">Total: {formatCurrency(reservation.totalAmount)}</p>
            <p>Opción de pago: {reservation.paymentOption === 'full_payment' ? 'Pago completo' : 'Cuotas'}</p>
            {(reservation.installments || []).map((inst, idx) => (
              <p key={idx} className="pl-4 text-sm text-gray-700">Cuota {idx + 1}: {formatCurrency(inst.amount)} - {formatDate(inst.dueDate)}</p>
            ))}
          </section>

          {/* Notas */}
          {reservation.notes && (
            <section>
              <h3 className="text-lg font-semibold mb-1">Notas</h3>
              <p>{reservation.notes}</p>
            </section>
          )}
        </div>

        <div className="flex justify-end gap-4 p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
            <motion.button
              onClick={onCancel}
              className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.02 }}
            >
              Cancelar
            </motion.button>
            <motion.button
              onClick={onConfirm}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition-colors"
              whileHover={{ scale: 1.02 }}
            >
              <CheckCircle className="w-5 h-5" />
              Confirmar Reserva
            </motion.button>
          </div>
      </motion.div>
    </motion.div>
  );
};

export default ReservationSummary;