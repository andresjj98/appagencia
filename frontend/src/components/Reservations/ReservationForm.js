import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Save, 
  Calendar, 
  MapPin, 
  Users, 
  Phone, 
  Mail, 
  Euro,
  FileText, 
  Home, 
  HeartHandshake,
  PlaneTakeoff, 
  PlaneLanding,
  PlusCircle, 
  MinusCircle,
  Globe,
  Hotel, 
  Bed, 
  Utensils, 
  PlusSquare,
  Info,
  Plane,
  Calculator // For pricing details
} from 'lucide-react';
import { generateReservationId } from '../../utils/helpers';

const ReservationForm = ({ reservation = null, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    invoiceNumber: reservation?.invoiceNumber || '',
    clientName: reservation?.clientName || '',
    clientEmail: reservation?.clientEmail || '',
    clientPhone: reservation?.clientPhone || '',
    clientAddress: reservation?.clientAddress || '',
    emergencyContactName: reservation?.emergencyContactName || '',
    emergencyContactPhone: reservation?.emergencyContactPhone || '',
    origin: reservation?.origin || '',
    destination: reservation?.destination || '',
    departureDate: reservation?.departureDate ? 
      new Date(reservation.departureDate).toISOString().split('T')[0] : '',
    returnDate: reservation?.returnDate ? 
      new Date(reservation.returnDate).toISOString().split('T')[0] : '',
    isMultiDestination: reservation?.isMultiDestination || false,
    multiDestinations: reservation?.multiDestinations || [{ origin: '', destination: '', departureDate: '', returnDate: '', hotel: null }],
    hotel: reservation?.hotel || { name: '', roomCategory: '', accommodation: [{ rooms: 1, adt: 0, chd: 0, inf: 0 }], mealPlan: '', hotelInclusions: [''] },
    inclusions: reservation?.inclusions || [''],
    flightDetails: reservation?.flightDetails || { airline: '', flightCategory: '', baggageAllowance: '' },
    passengersADT: reservation?.passengersADT || 1,
    passengersCHD: reservation?.passengersCHD || 0,
    passengersINF: reservation?.passengersINF || 0,
    pricePerADT: reservation?.pricePerADT || 0, // New pricing field
    pricePerCHD: reservation?.pricePerCHD || 0, // New pricing field
    pricePerINF: reservation?.pricePerINF || 0, // New pricing field
    totalAmount: reservation?.totalAmount || 0, // Will be calculated
    status: reservation?.status || 'pending',
    paymentStatus: reservation?.paymentStatus || 'pending',
    notes: reservation?.notes || ''
  });

  // State for calculated passenger totals
  const [totalPassengersCalculated, setTotalPassengersCalculated] = useState({
    total: 0,
    adt: 0,
    chd: 0,
    inf: 0
  });

  // Effect to recalculate totals whenever accommodation changes
  useEffect(() => {
    let totalADT = 0;
    let totalCHD = 0;
    let totalINF = 0;

    // Calculate total passengers from the main passenger fields
    totalADT = parseInt(formData.passengersADT) || 0;
    totalCHD = parseInt(formData.passengersCHD) || 0;
    totalINF = parseInt(formData.passengersINF) || 0;

    setTotalPassengersCalculated({
      total: totalADT + totalCHD + totalINF,
      adt: totalADT,
      chd: totalCHD,
      inf: totalINF
    });
  }, [formData.passengersADT, formData.passengersCHD, formData.passengersINF]);

  // Effect to calculate total amount based on passenger counts and prices
  useEffect(() => {
    const calculatedTotal = 
      (totalPassengersCalculated.adt * (parseFloat(formData.pricePerADT) || 0)) +
      (totalPassengersCalculated.chd * (parseFloat(formData.pricePerCHD) || 0)) +
      (totalPassengersCalculated.inf * (parseFloat(formData.pricePerINF) || 0));
    
    setFormData(prev => ({ ...prev, totalAmount: calculatedTotal.toFixed(2) }));
  }, [totalPassengersCalculated, formData.pricePerADT, formData.pricePerCHD, formData.pricePerINF]);


  const handleSubmit = (e) => {
    e.preventDefault();
    const totalPassengers = parseInt(formData.passengersADT) + parseInt(formData.passengersCHD) + parseInt(formData.passengersINF);
    const reservationData = {
      ...formData,
      id: reservation?.id || generateReservationId(),
      totalAmount: parseFloat(formData.totalAmount),
      passengers: totalPassengers, // This is the overall total, not from accommodation
      createdAt: reservation?.createdAt || new Date(),
      advisorId: '2',
      advisorName: 'Carlos Mendoza'
    };

    if (!formData.isMultiDestination) {
      reservationData.departureDate = new Date(formData.departureDate);
      reservationData.returnDate = new Date(formData.returnDate);
    } else {
      reservationData.multiDestinations = formData.multiDestinations.map(segment => ({
        ...segment,
        departureDate: new Date(segment.departureDate),
        returnDate: new Date(segment.returnDate)
      }));
      delete reservationData.origin;
      delete reservationData.destination;
      delete reservationData.departureDate;
      delete reservationData.returnDate;
      delete reservationData.hotel;
    }
    
    onSave(reservationData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMultiDestinationChange = (index, e) => {
    const { name, value } = e.target;
    const newSegments = [...formData.multiDestinations];
    newSegments[index] = { ...newSegments[index], [name]: value };
    setFormData(prev => ({ ...prev, multiDestinations: newSegments }));
  };

  const addMultiDestinationSegment = () => {
    setFormData(prev => ({
      ...prev,
      multiDestinations: [...prev.multiDestinations, { origin: '', destination: '', departureDate: '', returnDate: '', hotel: null }]
    }));
  };

  const removeMultiDestinationSegment = (index) => {
    const newSegments = [...formData.multiDestinations];
    newSegments.splice(index, 1);
    setFormData(prev => ({ ...prev, multiDestinations: newSegments }));
  };

  const handleHotelChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      hotel: { ...prev.hotel, [name]: value }
    }));
  };

  const handleAccommodationChange = (index, e) => {
    const { name, value } = e.target;
    const newAccommodation = [...formData.hotel.accommodation];
    newAccommodation[index] = { ...newAccommodation[index], [name]: parseInt(value) || 0 };
    setFormData(prev => ({
      ...prev,
      hotel: { ...prev.hotel, accommodation: newAccommodation }
    }));
  };

  const addAccommodationRoom = () => {
    setFormData(prev => ({
      ...prev,
      hotel: {
        ...prev.hotel,
        accommodation: [...prev.hotel.accommodation, { rooms: 1, adt: 0, chd: 0, inf: 0 }]
      }
    }));
  };

  const removeAccommodationRoom = (index) => {
    const newAccommodation = [...formData.hotel.accommodation];
    newAccommodation.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      hotel: { ...prev.hotel, accommodation: newAccommodation }
    }));
  };

  const handleHotelInclusionChange = (index, e) => {
    const newHotelInclusions = [...formData.hotel.hotelInclusions];
    newHotelInclusions[index] = e.target.value;
    setFormData(prev => ({
      ...prev,
      hotel: { ...prev.hotel, hotelInclusions: newHotelInclusions }
    }));
  };

  const addHotelInclusion = () => {
    setFormData(prev => ({
      ...prev,
      hotel: {
        ...prev.hotel,
        hotelInclusions: [...prev.hotel.hotelInclusions, '']
      }
    }));
  };

  const removeHotelInclusion = (index) => {
    const newHotelInclusions = [...formData.hotel.hotelInclusions];
    newHotelInclusions.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      hotel: { ...prev.hotel, hotelInclusions: newHotelInclusions }
    }));
  };

  const handleInclusionChange = (index, e) => {
    const newInclusions = [...formData.inclusions];
    newInclusions[index] = e.target.value;
    setFormData(prev => ({
      ...prev,
      inclusions: newInclusions
    }));
  };

  const addInclusion = () => {
    setFormData(prev => ({
      ...prev,
      inclusions: [...prev.inclusions, '']
    }));
  };

  const removeInclusion = (index) => {
    const newInclusions = [...formData.inclusions];
    newInclusions.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      inclusions: newInclusions
    }));
  };

  const handleFlightDetailsChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      flightDetails: { ...prev.flightDetails, [name]: value }
    }));
  };

  const handleMultiDestinationHotelChange = (segmentIndex, e) => {
    const { name, value } = e.target;
    const newMultiDestinations = [...formData.multiDestinations];
    // Initialize hotel object if it doesn't exist
    if (!newMultiDestinations[segmentIndex].hotel) {
      newMultiDestinations[segmentIndex].hotel = { name: '', roomCategory: '', accommodation: [{ rooms: 1, adt: 0, chd: 0, inf: 0 }], mealPlan: '', hotelInclusions: [''] };
    }
    newMultiDestinations[segmentIndex].hotel = {
      ...newMultiDestinations[segmentIndex].hotel,
      [name]: value
    };
    setFormData(prev => ({ ...prev, multiDestinations: newMultiDestinations }));
  };

  const handleMultiDestinationAccommodationChange = (segmentIndex, roomIndex, e) => {
    const { name, value } = e.target;
    const newMultiDestinations = [...formData.multiDestinations];
    const newAccommodation = [...(newMultiDestinations[segmentIndex].hotel?.accommodation || [])];
    newAccommodation[roomIndex] = { ...newAccommodation[roomIndex], [name]: parseInt(value) || 0 };
    newMultiDestinations[segmentIndex].hotel = {
      ...newMultiDestinations[segmentIndex].hotel,
      accommodation: newAccommodation
    };
    setFormData(prev => ({ ...prev, multiDestinations: newMultiDestinations }));
  };

  const addMultiDestinationAccommodationRoom = (segmentIndex) => {
    const newMultiDestinations = [...formData.multiDestinations];
    if (!newMultiDestinations[segmentIndex].hotel) {
      newMultiDestinations[segmentIndex].hotel = { name: '', roomCategory: '', accommodation: [], mealPlan: '', hotelInclusions: [''] };
    }
    newMultiDestinations[segmentIndex].hotel.accommodation.push({ rooms: 1, adt: 0, chd: 0, inf: 0 });
    setFormData(prev => ({ ...prev, multiDestinations: newMultiDestinations }));
  };

  const removeMultiDestinationAccommodationRoom = (segmentIndex, roomIndex) => {
    const newMultiDestinations = [...formData.multiDestinations];
    newMultiDestinations[segmentIndex].hotel.accommodation.splice(roomIndex, 1);
    setFormData(prev => ({ ...prev, multiDestinations: newMultiDestinations }));
  };

  const handleMultiDestinationHotelInclusionChange = (segmentIndex, inclusionIndex, e) => {
    const newMultiDestinations = [...formData.multiDestinations];
    const newHotelInclusions = [...(newMultiDestinations[segmentIndex].hotel?.hotelInclusions || [])];
    newHotelInclusions[inclusionIndex] = e.target.value;
    newMultiDestinations[segmentIndex].hotel = {
      ...newMultiDestinations[segmentIndex].hotel,
      hotelInclusions: newHotelInclusions
    };
    setFormData(prev => ({ ...prev, multiDestinations: newMultiDestinations }));
  };

  const addMultiDestinationHotelInclusion = (segmentIndex) => {
    const newMultiDestinations = [...formData.multiDestinations];
    if (!newMultiDestinations[segmentIndex].hotel) {
      newMultiDestinations[segmentIndex].hotel = { name: '', roomCategory: '', accommodation: [], mealPlan: '', hotelInclusions: [''] };
    }
    newMultiDestinations[segmentIndex].hotel.hotelInclusions.push('');
    setFormData(prev => ({ ...prev, multiDestinations: newMultiDestinations }));
  };

  const removeMultiDestinationHotelInclusion = (segmentIndex, inclusionIndex) => {
    const newMultiDestinations = [...formData.multiDestinations];
    newMultiDestinations[segmentIndex].hotel.hotelInclusions.splice(inclusionIndex, 1);
    setFormData(prev => ({ ...prev, multiDestinations: newMultiDestinations }));
  };

  const handleMultiDestinationInclusionChange = (segmentIndex, inclusionIndex, e) => {
    const newMultiDestinations = [...formData.multiDestinations];
    const newInclusions = [...(newMultiDestinations[segmentIndex].inclusions || [])];
    newInclusions[inclusionIndex] = e.target.value;
    newMultiDestinations[segmentIndex] = {
      ...newMultiDestinations[segmentIndex],
      inclusions: newInclusions
    };
    setFormData(prev => ({ ...prev, multiDestinations: newMultiDestinations }));
  };

  const addMultiDestinationInclusion = (segmentIndex) => {
    const newMultiDestinations = [...formData.multiDestinations];
    if (!newMultiDestinations[segmentIndex].inclusions) {
      newMultiDestinations[segmentIndex].inclusions = [''];
    } else {
      newMultiDestinations[segmentIndex].inclusions.push('');
    }
    setFormData(prev => ({ ...prev, multiDestinations: newMultiDestinations }));
  };

  const removeMultiDestinationInclusion = (segmentIndex, inclusionIndex) => {
    const newMultiDestinations = [...formData.multiDestinations];
    newMultiDestinations[segmentIndex].inclusions.splice(inclusionIndex, 1);
    setFormData(prev => ({ ...prev, multiDestinations: newMultiDestinations }));
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
            {reservation ? 'Editar Reserva' : 'Nueva Reserva'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Invoice Number */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detalles de la Factura
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Factura
              </label>
              <input
                type="text"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="INV-2025-001"
              />
            </div>
          </div>

          {/* Client Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Información del Cliente
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre del cliente"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="email"
                    name="clientEmail"
                    value={formData.clientEmail}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="email@ejemplo.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="tel"
                    name="clientPhone"
                    value={formData.clientPhone}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+34 600 000 000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <div className="relative">
                  <Home className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    name="clientAddress"
                    value={formData.clientAddress}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Calle, Ciudad, Código Postal"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5" />
              Contacto de Emergencia
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Contacto
                </label>
                <input
                  type="text"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre del contacto de emergencia"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono del Contacto
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="tel"
                    name="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+34 600 000 000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Trip Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Información del Viaje
            </h3>
            
            {/* Multi-destination Toggle */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Globe className="w-5 h-5 text-blue-600" />
              <label htmlFor="isMultiDestination" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                ¿Es un viaje multidestino?
              </label>
              <input
                type="checkbox"
                id="isMultiDestination"
                name="isMultiDestination"
                checked={formData.isMultiDestination}
                onChange={handleChange}
                className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            </div>

            {/* Passengers Section */}
            <div className="space-y-4 border border-gray-200 rounded-lg p-4">
              <h4 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Cantidad de Pasajeros
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adultos (ADT)
                  </label>
                  <input
                    type="number"
                    name="passengersADT"
                    value={formData.passengersADT}
                    onChange={handleChange}
                    min="0"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Niños (CHD)
                  </label>
                  <input
                    type="number"
                    name="passengersCHD"
                    value={formData.passengersCHD}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Infantes (INF)
                  </label>
                  <input
                    type="number"
                    name="passengersINF"
                    value={formData.passengersINF}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600 font-medium mt-2">
                Total de personas en la reserva: <span className="font-bold">{totalPassengersCalculated.total}</span> (ADT: {totalPassengersCalculated.adt}, CHD: {totalPassengersCalculated.chd}, INF: {totalPassengersCalculated.inf})
              </p>
            </div>


            {!formData.isMultiDestination ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Origen
                    </label>
                    <div className="relative">
                      <PlaneTakeoff className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        name="origin"
                        value={formData.origin}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Madrid, España"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Destino
                    </label>
                    <div className="relative">
                      <PlaneLanding className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        name="destination"
                        value={formData.destination}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="París, Francia"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Salida
                    </label>
                    <div className="relative">
                      <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="date"
                        name="departureDate"
                        value={formData.departureDate}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Regreso
                    </label>
                    <div className="relative">
                      <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="date"
                        name="returnDate"
                        value={formData.returnDate}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Single Hotel Section */}
                <div className="space-y-4 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                    <Hotel className="w-5 h-5" />
                    Detalles del Hotel
                  </h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Hotel
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.hotel.name}
                      onChange={handleHotelChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Hotel Gran Via"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoría de Habitación
                    </label>
                    <input
                      type="text"
                      name="roomCategory"
                      value={formData.hotel.roomCategory}
                      onChange={handleHotelChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Doble Estándar, Suite"
                    />
                  </div>
                  
                  {/* Accommodation Details */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                        <Bed className="w-4 h-4" />
                        Acomodación
                      </h5>
                      <motion.button
                        type="button"
                        onClick={addAccommodationRoom}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <PlusCircle className="w-4 h-4" />
                        Añadir Habitación
                      </motion.button>
                    </div>
                    {formData.hotel.accommodation.map((room, roomIndex) => (
                      <div key={roomIndex} className="grid grid-cols-4 gap-2 items-end relative p-2 bg-gray-100 rounded-lg">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Habitaciones</label>
                          <input
                            type="number"
                            name="rooms"
                            value={room.rooms}
                            onChange={(e) => handleAccommodationChange(roomIndex, e)}
                            min="1"
                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">ADT</label>
                          <input
                            type="number"
                            name="adt"
                            value={room.adt}
                            onChange={(e) => handleAccommodationChange(roomIndex, e)}
                            min="0"
                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">CHD</label>
                          <input
                            type="number"
                            name="chd"
                            value={room.chd}
                            onChange={(e) => handleAccommodationChange(roomIndex, e)}
                            min="0"
                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">INF</label>
                          <input
                            type="number"
                            name="inf"
                            value={room.inf}
                            onChange={(e) => handleAccommodationChange(roomIndex, e)}
                            min="0"
                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        {formData.hotel.accommodation.length > 1 && (
                          <motion.button
                            type="button"
                            onClick={() => removeAccommodationRoom(roomIndex)}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Alimentación
                    </label>
                    <select
                      name="mealPlan"
                      value={formData.hotel.mealPlan}
                      onChange={handleHotelChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccionar</option>
                      <option value="solo_alojamiento">Solo Alojamiento (SA)</option>
                      <option value="desayuno">Desayuno (AD)</option>
                      <option value="media_pension">Media Pensión (MP)</option>
                      <option value="pension_completa">Pensión Completa (PC)</option>
                      <option value="todo_incluido">Todo Incluido (TI)</option>
                    </select>
                  </div>
                  
                  {/* Hotel Inclusions */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                        <Info className="w-4 h-4" />
                        Inclusiones del Hotel
                      </h5>
                      <motion.button
                        type="button"
                        onClick={addHotelInclusion}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <PlusCircle className="w-4 h-4" />
                        Añadir Inclusión
                      </motion.button>
                    </div>
                    {formData.hotel.hotelInclusions.map((inclusion, inclusionIndex) => (
                      <div key={inclusionIndex} className="flex items-center gap-2 relative">
                        <input
                          type="text"
                          value={inclusion}
                          onChange={(e) => handleHotelInclusionChange(inclusionIndex, e)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Ej: Wifi, Piscina, Gimnasio..."
                        />
                        {formData.hotel.hotelInclusions.length > 1 && (
                          <motion.button
                            type="button"
                            onClick={() => removeHotelInclusion(inclusionIndex)}
                            className="p-1 bg-red-500 text-white rounded-full shadow-md"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <MinusCircle className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-semibold text-gray-800">Segmentos de Viaje</h4>
                  <motion.button
                    type="button"
                    onClick={addMultiDestinationSegment}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <PlusCircle className="w-5 h-5" />
                    Agregar Segmento
                  </motion.button>
                </div>
                {formData.multiDestinations.map((segment, index) => (
                  <motion.div
                    key={index}
                    className="space-y-4 p-4 bg-gray-50 rounded-lg relative border border-gray-200"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h5 className="font-bold text-gray-900">Segmento {index + 1}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Origen
                        </label>
                        <div className="relative">
                          <PlaneTakeoff className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                          <input
                            type="text"
                            name="origin"
                            value={segment.origin}
                            onChange={(e) => handleMultiDestinationChange(index, e)}
                            required
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ciudad, País"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Destino
                        </label>
                        <div className="relative">
                          <PlaneLanding className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                          <input
                            type="text"
                            name="destination"
                            value={segment.destination}
                            onChange={(e) => handleMultiDestinationChange(index, e)}
                            required
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ciudad, País"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fecha Salida
                        </label>
                        <div className="relative">
                          <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                          <input
                            type="date"
                            name="departureDate"
                            value={segment.departureDate}
                            onChange={(e) => handleMultiDestinationChange(index, e)}
                            required
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fecha Regreso
                        </label>
                        <div className="relative">
                          <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                          <input
                            type="date"
                            name="returnDate"
                            value={segment.returnDate}
                            onChange={(e) => handleMultiDestinationChange(index, e)}
                            required
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Multi-Destination Hotel Section */}
                    <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-white">
                      <h4 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                        <Hotel className="w-5 h-5" />
                        Detalles del Hotel para {segment.destination || 'este segmento'}
                      </h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre del Hotel
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={segment.hotel?.name || ''}
                          onChange={(e) => handleMultiDestinationHotelChange(index, e)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Ej: Hotel Gran Via"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Categoría de Habitación
                        </label>
                        <input
                          type="text"
                          name="roomCategory"
                          value={segment.hotel?.roomCategory || ''}
                          onChange={(e) => handleMultiDestinationHotelChange(index, e)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Ej: Doble Estándar, Suite"
                        />
                      </div>
                      
                      {/* Accommodation Details for Multi-Destination */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                            <Bed className="w-4 h-4" />
                            Acomodación
                          </h5>
                          <motion.button
                            type="button"
                            onClick={() => addMultiDestinationAccommodationRoom(index)}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <PlusCircle className="w-4 h-4" />
                            Añadir Habitación
                          </motion.button>
                        </div>
                        {(segment.hotel?.accommodation || []).map((room, roomIndex) => (
                          <div key={roomIndex} className="grid grid-cols-4 gap-2 items-end relative p-2 bg-gray-100 rounded-lg">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Habitaciones</label>
                              <input
                                type="number"
                                name="rooms"
                                value={room.rooms}
                                onChange={(e) => handleMultiDestinationAccommodationChange(index, roomIndex, e)}
                                min="1"
                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">ADT</label>
                              <input
                                type="number"
                                name="adt"
                                value={room.adt}
                                onChange={(e) => handleMultiDestinationAccommodationChange(index, roomIndex, e)}
                                min="0"
                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">CHD</label>
                              <input
                                type="number"
                                name="chd"
                                value={room.chd}
                                onChange={(e) => handleMultiDestinationAccommodationChange(index, roomIndex, e)}
                                min="0"
                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">INF</label>
                              <input
                                type="number"
                                name="inf"
                                value={room.inf}
                                onChange={(e) => handleMultiDestinationAccommodationChange(index, roomIndex, e)}
                                min="0"
                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                              />
                            </div>
                            {(segment.hotel?.accommodation || []).length > 1 && (
                              <motion.button
                                type="button"
                                onClick={() => removeMultiDestinationAccommodationRoom(index, roomIndex)}
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo de Alimentación
                        </label>
                        <select
                          name="mealPlan"
                          value={segment.hotel?.mealPlan || ''}
                          onChange={(e) => handleMultiDestinationHotelChange(index, e)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Seleccionar</option>
                          <option value="solo_alojamiento">Solo Alojamiento (SA)</option>
                          <option value="desayuno">Desayuno (AD)</option>
                          <option value="media_pension">Media Pensión (MP)</option>
                          <option value="pension_completa">Pensión Completa (PC)</option>
                          <option value="todo_incluido">Todo Incluido (TI)</option>
                        </select>
                      </div>
                      
                      {/* Hotel Inclusions for Multi-Destination */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                            <Info className="w-4 h-4" />
                            Inclusiones del Hotel
                          </h5>
                          <motion.button
                            type="button"
                            onClick={() => addMultiDestinationHotelInclusion(index)}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <PlusCircle className="w-4 h-4" />
                            Añadir Inclusión
                          </motion.button>
                        </div>
                        {(segment.hotel?.hotelInclusions || []).map((inclusion, inclusionIndex) => (
                          <div key={inclusionIndex} className="flex items-center gap-2 relative">
                            <input
                              type="text"
                              value={inclusion}
                              onChange={(e) => handleMultiDestinationHotelInclusionChange(index, inclusionIndex, e)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Ej: Wifi, Piscina, Gimnasio..."
                            />
                            {(segment.hotel?.hotelInclusions || []).length > 1 && (
                              <motion.button
                                type="button"
                                onClick={() => removeMultiDestinationHotelInclusion(index, inclusionIndex)}
                                className="p-1 bg-red-500 text-white rounded-full shadow-md"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <MinusCircle className="w-4 h-4" />
                              </motion.button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {formData.multiDestinations.length > 1 && (
                      <motion.button
                        type="button"
                        onClick={() => removeMultiDestinationSegment(index)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <MinusCircle className="w-5 h-5" />
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Other Inclusions Section (Moved to top level of Trip Information) */}
            <div className="space-y-4 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                  <PlusSquare className="w-5 h-5" />
                  Otras Inclusiones del Viaje
                </h4>
                <motion.button
                  type="button"
                  onClick={addInclusion}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <PlusCircle className="w-5 h-5" />
                  Añadir Inclusión
                </motion.button>
              </div>
              {formData.inclusions.map((inclusion, inclusionIndex) => (
                <div key={inclusionIndex} className="flex items-center gap-2 relative">
                  <input
                    type="text"
                    value={inclusion}
                    onChange={(e) => handleInclusionChange(inclusionIndex, e)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Traslados aeropuerto, excursión, seguro de viaje..."
                  />
                  {formData.inclusions.length > 1 && (
                    <motion.button
                      type="button"
                      onClick={() => removeInclusion(inclusionIndex)}
                      className="p-1 bg-red-500 text-white rounded-full shadow-md"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <MinusCircle className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              ))}
            </div>

            {/* Flight Details Section */}
            <div className="space-y-4 border border-gray-200 rounded-lg p-4">
              <h4 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                <Plane className="w-5 h-5" />
                Detalles Generales del Vuelo
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aerolínea
                </label>
                <input
                  type="text"
                  name="airline"
                  value={formData.flightDetails.airline}
                  onChange={handleFlightDetailsChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Iberia, Air France"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría del Vuelo
                </label>
                <select
                  name="flightCategory"
                  value={formData.flightDetails.flightCategory}
                  onChange={handleFlightDetailsChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar</option>
                  <option value="economica">Económica</option>
                  <option value="premium_economica">Premium Económica</option>
                  <option value="business">Business</option>
                  <option value="primera_clase">Primera Clase</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipaje Permitido (por defecto)
                </label>
                <input
                  type="text"
                  name="baggageAllowance"
                  value={formData.flightDetails.baggageAllowance}
                  onChange={handleFlightDetailsChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 1 maleta de 23kg, 2 maletas de 32kg"
                />
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Euro className="w-5 h-5" />
              Detalles de la Reserva
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio por Adulto (ADT) (€)
                </label>
                <input
                  type="number"
                  name="pricePerADT"
                  value={formData.pricePerADT}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio por Niño (CHD) (€)
                </label>
                <input
                  type="number"
                  name="pricePerCHD"
                  value={formData.pricePerCHD}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio por Infante (INF) (€)
                </label>
                <input
                  type="number"
                  name="pricePerINF"
                  value={formData.pricePerINF}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <h4 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                <Calculator className="w-6 h-6" />
                Total del Plan:
              </h4>
              <span className="text-2xl font-extrabold text-blue-800">
                €{parseFloat(formData.totalAmount).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado de la Reserva
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmada</option>
                  <option value="cancelled">Cancelada</option>
                  <option value="completed">Completada</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado del Pago
                </label>
                <select
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Pendiente</option>
                  <option value="partial">Parcial</option>
                  <option value="paid">Pagado</option>
                  <option value="refunded">Reembolsado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas Adicionales
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Notas sobre la reserva..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <motion.button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancelar
            </motion.button>
            <motion.button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Save className="w-5 h-5" />
              {reservation ? 'Actualizar' : 'Crear'} Reserva
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ReservationForm;