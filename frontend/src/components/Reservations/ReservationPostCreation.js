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
  Info
} from 'lucide-react';

const ReservationPostCreation = ({ reservation, onClose, onUpdateReservation }) => {
  const [passengers, setPassengers] = useState(reservation.passengersData || Array(reservation.passengers).fill({ name: '', document: '', dob: '' }));
  const [documents, setDocuments] = useState(reservation.documents || []);
  const [hotelDetails, setHotelDetails] = useState(reservation.hotelDetails || (reservation.hotel ? { cost: '', confirmation: '' } : null));
  const [flightDetails, setFlightDetails] = useState(reservation.flightDetails || { itinerary: '', trackingCode: '' });

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

  const handleFlightDetailChange = (e) => {
    const { name, value } = e.target;
    setFlightDetails(prev => ({ ...prev, [name]: value }));
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
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    name="name"
                    value={pax.name}
                    onChange={(e) => handlePassengerChange(index, e)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder={`Pasajero ${index + 1}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Documento</label>
                  <input
                    type="text"
                    name="document"
                    value={pax.document}
                    onChange={(e) => handlePassengerChange(index, e)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="DNI/Pasaporte"
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
          {reservation.hotel && (
            <div className="space-y-4 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Hotel className="w-5 h-5" />
                Detalles del Hotel
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Costo del Hotel (€)</label>
                <input
                  type="number"
                  name="cost"
                  value={hotelDetails?.cost || ''}
                  onChange={handleHotelDetailChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Costo total del hotel"
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
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Info className="w-4 h-4 text-blue-500" />
                Solicitar documentación del hotel si es necesario.
              </p>
            </div>
          )}

          {/* Flight Details (Conditional) */}
          {reservation.flightDetails && (
            <div className="space-y-4 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Plane className="w-5 h-5" />
                Detalles del Vuelo
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Itinerario del Vuelo</label>
                <textarea
                  name="itinerary"
                  value={flightDetails?.itinerary || ''}
                  onChange={handleFlightDetailChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Detalles del itinerario de vuelo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código de Rastreo (PNR)</label>
                <input
                  type="text"
                  name="trackingCode"
                  value={flightDetails?.trackingCode || ''}
                  onChange={handleFlightDetailChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Código de rastreo del vuelo (PNR)"
                />
              </div>
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