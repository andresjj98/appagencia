import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  CheckCircle,
  Upload,
  FileText,
  Users,
  Hotel,
  Plane,
  Save,
  PlusCircle,
  MinusCircle,
  Info,
  List
} from 'lucide-react';

const ReservationPostCreation = ({ reservation, onClose, onUpdateReservation }) => {
  const [passengers, setPassengers] = useState(
    reservation.passengersData ||
      Array.from({ length: reservation.passengers }, () => ({
        firstName: '',
        lastName: '',
        documentType: '',
        documentNumber: '',
        dob: ''
      }))
  );
  const [documents, setDocuments] = useState(reservation.documents || []);
  const hotelInfo = reservation.hotel || reservation.hotels?.[0] || null;
  const [hotelDetails, setHotelDetails] = useState(
    reservation.hotelDetails ||
      (hotelInfo
        ? { price: '', offer: '', confirmation: '', screenshots: [] }
        : null)
  );
  const [flightDetails, setFlightDetails] = useState(
    Array.isArray(reservation.flightDetails)
      ? reservation.flightDetails
      : reservation.flights?.map(() => ({
          trackingCode: '',
          itineraries: [
            { flightNumber: '', departureTime: '', arrivalTime: '' }
          ]
        })) || []
  );

  const handlePassengerChange = (index, e) => {
    const { name, value } = e.target;
    const newPassengers = [...passengers];
    newPassengers[index] = { ...newPassengers[index], [name]: value };
    setPassengers(newPassengers);
  };

  const handleDocumentUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const newDoc = { name: file.name, type: file.type, url: URL.createObjectURL(file) };
      setDocuments(prev => [...prev, newDoc]);
      e.target.value = null; // Clear input
    }
  };

  const handleRemoveDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleHotelDetailChange = (e) => {
    const { name, value } = e.target;
    setHotelDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleFlightDetailChange = (index, e) => {
    const { name, value } = e.target;
    setFlightDetails(prev =>
      prev.map((fd, i) => (i === index ? { ...fd, [name]: value } : fd))
    );
  };

  const handleItineraryChange = (flightIndex, itineraryIndex, e) => {
    const { name, value } = e.target;
    setFlightDetails(prev =>
      prev.map((fd, i) =>
        i === flightIndex
          ? {
              ...fd,
              itineraries: fd.itineraries.map((it, j) =>
                j === itineraryIndex ? { ...it, [name]: value } : it
              )
            }
          : fd
      )
    );
  };

  const addItinerary = (flightIndex) => {
    setFlightDetails(prev =>
      prev.map((fd, i) =>
        i === flightIndex
          ? {
              ...fd,
              itineraries: [
                ...fd.itineraries,
                { flightNumber: '', departureTime: '', arrivalTime: '' }
              ]
            }
          : fd
      )
    );
  };

  const removeItinerary = (flightIndex, itineraryIndex) => {
    setFlightDetails(prev =>
      prev.map((fd, i) =>
        i === flightIndex
          ? {
              ...fd,
              itineraries: fd.itineraries.filter((_, j) => j !== itineraryIndex)
            }
          : fd
      )
    );
  };

  const handleHotelScreenshotUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const newShot = { name: file.name, url: URL.createObjectURL(file) };
      setHotelDetails(prev => ({
        ...prev,
        screenshots: [...(prev?.screenshots || []), newShot]
      }));
      e.target.value = null;
    }
  };

  const handleRemoveScreenshot = (index) => {
    setHotelDetails(prev => ({
      ...prev,
      screenshots: (prev?.screenshots || []).filter((_, i) => i !== index)
    }));
  };

  const handleSaveAllDetails = () => {
    const updatedReservation = {
      ...reservation,
      passengersData: passengers,
      documents: documents,
      hotelDetails: hotelDetails,
      flightDetails: flightDetails,
      // Mark as processed or ready for next step
      status: 'pending_processing' // Example status
    };
    onUpdateReservation(updatedReservation);
    onClose();
  };

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
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Detalles Adicionales de la Reserva
          </h2>
          <motion.button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-6 h-6" />
            <p className="font-medium">¡Reserva creada y enviada al operador con éxito!</p>
          </div>

          {/* Passenger Information */}
          <div className="space-y-4 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Información de Pasajeros
            </h3>
            {passengers.map((pax, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
                  <input
                    type="text"
                    name="firstName"
                    value={pax.firstName}
                    onChange={(e) => handlePassengerChange(index, e)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder={`Pasajero ${index + 1}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                  <input
                    type="text"
                    name="lastName"
                    value={pax.lastName}
                    onChange={(e) => handlePassengerChange(index, e)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Apellidos"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Documento</label>
                  <select
                    name="documentType"
                    value={pax.documentType}
                    onChange={(e) => handlePassengerChange(index, e)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Seleccionar</option>
                    <option value="DNI">DNI</option>
                    <option value="Pasaporte">Pasaporte</option>
                    <option value="Cédula">Cédula</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número Identificación</label>
                  <input
                    type="text"
                    name="documentNumber"
                    value={pax.documentNumber}
                    onChange={(e) => handlePassengerChange(index, e)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"                    
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Nacimiento</label>
                  <input
                    type="date"
                    name="dob"
                    value={pax.dob}
                    onChange={(e) => handlePassengerChange(index, e)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Document Upload */}
          <div className="space-y-4 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Cargar Documentación
            </h3>
            <input
              type="file"
              onChange={handleDocumentUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <div className="space-y-2">
              {documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">{doc.name}</p>
                  <motion.button
                    onClick={() => handleRemoveDocument(index)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded-full"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <MinusCircle className="w-4 h-4" />
                  </motion.button>
                </div>
              ))}
            </div>
          </div>

          {/* Hotel Details (Conditional) */}
          {hotelInfo && (
            <div className="space-y-4 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Hotel className="w-5 h-5" />
                Detalles del Hotel
              </h3>
              <div className="text-sm text-gray-700 space-y-1">
                {hotelInfo.name && <p><span className="font-medium">Nombre:</span> {hotelInfo.name}</p>}
                {hotelInfo.roomCategory && (
                  <p>
                    <span className="font-medium">Categoría:</span> {hotelInfo.roomCategory}
                  </p>
                )}
                {hotelInfo.mealPlan && (
                  <p>
                    <span className="font-medium">Plan:</span> {hotelInfo.mealPlan}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio del Hotel (€)</label>
                <input
                  type="number"
                  name="price"
                  value={hotelDetails?.price || ''}
                  onChange={handleHotelDetailChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Precio total del hotel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Oferta Especial</label>
                <input
                  type="text"
                  name="offer"
                  value={hotelDetails?.offer || ''}
                  onChange={handleHotelDetailChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ej: Descuento, promoción"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código de Confirmación</label>
                <input
                  type="text"
                  name="confirmation"
                  value={hotelDetails?.confirmation || ''}
                  onChange={handleHotelDetailChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Código de confirmación del hotel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pantallazos/Imágenes</label>
                <input
                  type="file"
                  onChange={handleHotelScreenshotUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <div className="space-y-2 mt-2">
                  {(hotelDetails?.screenshots || []).map((shot, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">{shot.name}</p>
                      <motion.button
                        onClick={() => handleRemoveScreenshot(index)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded-full"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <MinusCircle className="w-4 h-4" />
                      </motion.button>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Info className="w-4 h-4 text-blue-500" />
                Solicitar documentación del hotel si es necesario.
              </p>
            </div>
          )}

          {/* Flight Details (Conditional) */}
          {reservation.flights && reservation.flights.length > 0 && (
            <div className="space-y-4 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Plane className="w-5 h-5" />
                Detalles del Vuelo
              </h3>
              {reservation.flights.map((flight, index) => (
                <div key={index} className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="text-sm text-gray-700 space-y-1">
                    {flight.airline && (
                      <p><span className="font-medium">Aerolínea:</span> {flight.airline}</p>
                    )}
                    {flight.flightCategory && (
                      <p><span className="font-medium">Categoría:</span> {flight.flightCategory}</p>
                    )}
                    {flight.baggageAllowance && (
                      <p><span className="font-medium">Equipaje:</span> {flight.baggageAllowance}</p>
                    )}
                  </div>
                  <div className="space-y-3 border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                        <List className="w-4 h-4" /> Itinerarios de Vuelo
                      </h5>
                      <motion.button
                        type="button"
                        onClick={() => addItinerary(index)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <PlusCircle className="w-4 h-4" /> Añadir Itinerario
                      </motion.button>
                    </div>
                    {(flightDetails[index]?.itineraries || []).map((it, itIndex) => (
                      <div key={itIndex} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end relative p-2 bg-gray-100 rounded-lg">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Número de Vuelo</label>
                          <input
                            type="text"
                            name="flightNumber"
                            value={it.flightNumber}
                            onChange={(e) => handleItineraryChange(index, itIndex, e)}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                            placeholder="Ej: IB3100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Hora Salida</label>
                          <input
                            type="time"
                            name="departureTime"
                            value={it.departureTime}
                            onChange={(e) => handleItineraryChange(index, itIndex, e)}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Hora Llegada</label>
                          <input
                            type="time"
                            name="arrivalTime"
                            value={it.arrivalTime}
                            onChange={(e) => handleItineraryChange(index, itIndex, e)}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        {(flightDetails[index]?.itineraries.length || 0) > 1 && (
                          <motion.button
                            type="button"
                            onClick={() => removeItinerary(index, itIndex)}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <MinusCircle className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código de Rastreo (PNR)</label>
                    <input
                      type="text"
                      name="trackingCode"
                      value={flightDetails[index]?.trackingCode || ''}
                      onChange={(e) => handleFlightDetailChange(index, e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Código de rastreo del vuelo (PNR)"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <motion.button
              onClick={handleSaveAllDetails}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Save className="w-5 h-5" />
              Guardar Todos los Detalles
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReservationPostCreation;