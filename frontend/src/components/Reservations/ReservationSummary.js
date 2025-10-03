import React from 'react';
import { motion } from 'framer-motion';
import {
  X,
  AlertTriangle,
  CheckCircle,
  Car,
  PlaneLanding,
  PlaneTakeoff,
  User,
  MapPin,
  Users,
  Plane,
  Hotel,
  Ticket,
  HeartPulse,
  DollarSign,
  FileText,
  Calendar,
  Globe
} from 'lucide-react';
import { useSettings } from '../../utils/SettingsContext';

const ReservationSummary = ({ reservation, onConfirm, onCancel }) => {
  const { formatCurrency, formatDate } = useSettings();

  // Debug: Ver qué llega en transfers
  console.log('Reservation data in summary:', reservation);
  console.log('Transfers:', reservation?.transfers);

  // Defensive check in case reservation data is not passed correctly.
  if (!reservation) {
    return null;
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-2xl font-bold text-gray-900">Confirmar Reserva</h2>
          <motion.button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            whileHover={{ scale: 1.1 }}
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>

        <div className="overflow-y-auto p-6 space-y-4">
          {/* Warning Message */}
          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-800">Atención</h4>
              <p className="text-sm text-yellow-700">Verifique que toda la información sea correcta antes de confirmar.</p>
            </div>
          </div>

          {/* Datos del Titular */}
          <section className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Datos del Titular
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Nombre:</span>
                <p className="text-gray-900">{reservation.clientName}</p>
              </div>
              {reservation.clientId && (
                <div>
                  <span className="font-semibold text-gray-700">Identificación:</span>
                  <p className="text-gray-900">{reservation.clientId}</p>
                </div>
              )}
              <div>
                <span className="font-semibold text-gray-700">Email:</span>
                <p className="text-gray-900">{reservation.clientEmail}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Teléfono:</span>
                <p className="text-gray-900">{reservation.clientPhone}</p>
              </div>
              {reservation.clientAddress && (
                <div className="md:col-span-2">
                  <span className="font-semibold text-gray-700">Dirección:</span>
                  <p className="text-gray-900">{reservation.clientAddress}</p>
                </div>
              )}
              {reservation.emergencyContact && (reservation.emergencyContact.name || reservation.emergencyContact.phone) && (
                <div className="md:col-span-2">
                  <span className="font-semibold text-gray-700">Contacto de Emergencia:</span>
                  <p className="text-gray-900">
                    {reservation.emergencyContact.name}
                    {reservation.emergencyContact.phone && ` (${reservation.emergencyContact.phone})`}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Itinerario */}
          <section className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Itinerario
            </h3>
            <div className="space-y-2">
              {(reservation.segments || []).map((seg, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm bg-white rounded-lg p-3 shadow-sm">
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {seg.origin} → {seg.destination}
                    </p>
                    <p className="text-gray-600 text-xs flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(seg.departureDate)} - {formatDate(seg.returnDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pasajeros */}
          <section className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Pasajeros
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-2xl font-bold text-purple-600">{reservation.passengersADT}</p>
                <p className="text-xs text-gray-600">Adultos</p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-2xl font-bold text-purple-600">{reservation.passengersCHD}</p>
                <p className="text-xs text-gray-600">Niños</p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-2xl font-bold text-purple-600">{reservation.passengersINF}</p>
                <p className="text-xs text-gray-600">Infantes</p>
              </div>
            </div>
          </section>

          {/* Vuelos */}
          {reservation.flights && reservation.flights.length > 0 && (
            <section className="bg-sky-50 rounded-xl p-4 border border-sky-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Plane className="w-5 h-5 text-sky-600" />
                Vuelos
              </h3>
              <div className="space-y-3">
                {(reservation.flights || []).map((flight, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="font-semibold text-gray-900">{flight.airline}</p>
                    {flight.flightCategory && (
                      <p className="text-sm text-gray-600">Categoría: {flight.flightCategory}</p>
                    )}
                    {flight.baggageAllowance && (
                      <p className="text-sm text-gray-600">Equipaje: {flight.baggageAllowance}</p>
                    )}
                    {flight.trackingCode && (
                      <p className="text-sm text-gray-600">PNR: {flight.trackingCode}</p>
                    )}
                    {(flight.itineraries || []).length > 0 && (
                      <div className="mt-2 pl-3 border-l-2 border-sky-300 space-y-1">
                        {flight.itineraries.map((it, i) => (
                          <p key={i} className="text-xs text-gray-700">
                            Vuelo {it.flightNumber} - {it.departureTime} → {it.arrivalTime}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Hoteles */}
          {reservation.hotels && reservation.hotels.length > 0 && (
            <section className="bg-orange-50 rounded-xl p-4 border border-orange-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Hotel className="w-5 h-5 text-orange-600" />
                Hoteles
              </h3>
              <div className="space-y-3">
                {(reservation.hotels || []).map((hotel, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="font-semibold text-gray-900">{hotel.name}</p>
                    {hotel.roomCategory && (
                      <p className="text-sm text-gray-600">Categoría: {hotel.roomCategory}</p>
                    )}
                    {hotel.mealPlan && (
                      <p className="text-sm text-gray-600">Plan de Comidas: {hotel.mealPlan}</p>
                    )}
                    {hotel.accommodation && hotel.accommodation.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {hotel.accommodation.map((acc, i) => (
                          <p key={i} className="text-xs text-gray-700 bg-orange-50 rounded px-2 py-1 inline-block mr-2">
                            {acc.rooms} hab. - ADT: {acc.adt}, CHD: {acc.chd}, INF: {acc.inf}
                          </p>
                        ))}
                      </div>
                    )}
                    {hotel.hotelInclusions && hotel.hotelInclusions.length > 0 && (
                      <ul className="mt-2 pl-4 list-disc text-xs text-gray-600">
                        {hotel.hotelInclusions.map((inc, i) => (
                          <li key={i}>{inc}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Traslados */}
          {reservation.transfers && Object.keys(reservation.transfers).length > 0 && (() => {
            const hasAnyTransfer = Object.values(reservation.transfers).some(t => t.hasIn || t.hasOut);
            if (!hasAnyTransfer) return null;

            return (
              <section className="bg-green-50 rounded-xl p-4 border border-green-200">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Car className="w-5 h-5 text-green-600" />
                  Traslados
                </h3>
                <div className="space-y-3">
                  {Object.entries(reservation.transfers).map(([segmentIndex, transfer]) => {
                    const idx = parseInt(segmentIndex);
                    const segment = reservation.segments?.[idx];
                    const hasTransfers = transfer.hasIn || transfer.hasOut;

                    if (!hasTransfers) return null;

                    return (
                      <div key={segmentIndex} className="bg-white rounded-lg p-3 shadow-sm">
                        {reservation.segments.length > 1 && segment && (
                          <p className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-green-600" />
                            Segmento {idx + 1}: {segment.origin} → {segment.destination}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {transfer.hasIn && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm font-medium border border-green-300">
                              <PlaneLanding className="w-4 h-4" />
                              Traslado IN
                            </span>
                          )}
                          {transfer.hasOut && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium border border-blue-300">
                              <PlaneTakeoff className="w-4 h-4" />
                              Traslado OUT
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })()}

          {/* Tours */}
          {reservation.tours && reservation.tours.length > 0 && (
            <section className="bg-teal-50 rounded-xl p-4 border border-teal-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-teal-600" />
                Servicios y Tours
              </h3>
              <div className="space-y-2">
                {(reservation.tours || []).map((tour, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 shadow-sm flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">{tour.name}</p>
                      <p className="text-xs text-gray-600">{formatDate(tour.date)}</p>
                    </div>
                    <p className="text-sm font-bold text-teal-600">{formatCurrency(tour.cost)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Asistencias Médicas */}
          {reservation.medicalAssistances && reservation.medicalAssistances.length > 0 && (
            <section className="bg-red-50 rounded-xl p-4 border border-red-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-red-600" />
                Asistencias Médicas y Seguros
              </h3>
              <div className="space-y-2">
                {(reservation.medicalAssistances || []).map((med, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="font-semibold text-gray-900">{med.planType}</p>
                    <p className="text-xs text-gray-600">
                      {formatDate(med.startDate)} - {formatDate(med.endDate)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Pago */}
          <section className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Información de Pago
            </h3>
            <div className="space-y-2 text-sm">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-600">Precio ADT:</span>
                    <p className="font-semibold text-gray-900">{formatCurrency(reservation.pricePerADT)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Precio CHD:</span>
                    <p className="font-semibold text-gray-900">{formatCurrency(reservation.pricePerCHD)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Precio INF:</span>
                    <p className="font-semibold text-gray-900">{formatCurrency(reservation.pricePerINF)}</p>
                  </div>
                  <div className="col-span-2 mt-2 pt-2 border-t border-emerald-200">
                    <span className="text-gray-600">Total:</span>
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(reservation.totalAmount)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="font-semibold text-gray-900">
                  {reservation.paymentOption === 'full_payment' ? 'Pago Completo' : 'Pago en Cuotas'}
                </p>
                {reservation.installments && reservation.installments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {reservation.installments.map((inst, idx) => (
                      <p key={idx} className="text-xs text-gray-700 bg-emerald-50 rounded px-2 py-1">
                        Cuota {idx + 1}: {formatCurrency(inst.amount)} - Vence: {formatDate(inst.dueDate)}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Notas */}
          {reservation.notes && (
            <section className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                Notas Adicionales
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{reservation.notes}</p>
            </section>
          )}
        </div>

        <div className="flex justify-end gap-4 p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0 rounded-b-2xl">
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
