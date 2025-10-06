import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Users, Globe, Plane, Hotel, Ticket, BriefcaseMedical, Euro, ArrowLeft, X, Save, Info, MinusCircle, PlusCircle, Bed, Utensils, List, DollarSign, Calculator, Car, PlaneLanding, PlaneTakeoff, XCircle, Upload, FileText } from 'lucide-react';
import { useAuth } from '../../pages/AuthContext';
import { useSettings } from '../../utils/SettingsContext';
import AirlineInput from '../common/AirlineInput';

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const formatDate = (date) => {
  if (!date) return getTodayDate();
  return date.split('T')[0];
};

const formatNumberWithThousands = (value) => {
  if (!value || value === 0 || value === '0') return '';
  const num = typeof value === 'string' ? parseFloat(value.replace(/\./g, '')) : value;
  if (isNaN(num)) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const SectionForm = ({ children, onBack, title }) => (
  <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
    <div className="flex items-center mb-6">
      <motion.button onClick={onBack} className="p-2 mr-4 rounded-full hover:bg-gray-100" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <ArrowLeft className="w-5 h-5 text-gray-600" />
      </motion.button>
      <h3 className="text-xl font-bold text-gray-800">{title}</h3>
    </div>
    <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">{children}</div>
  </motion.div>
);

const ClientForm = ({ data, onChange }) => {
  const handleChange = (e) => onChange({ ...data, [e.target.name]: e.target.value });
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><label className="block text-sm font-medium mb-1">Nombre</label><input type="text" name="name" value={data.name} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
      <div><label className="block text-sm font-medium mb-1">Identificación</label><input type="text" name="id_card" value={data.id_card} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
      <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" name="email" value={data.email} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
      <div><label className="block text-sm font-medium mb-1">Teléfono</label><input type="tel" name="phone" value={data.phone} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
      <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Dirección</label><input type="text" name="address" value={data.address} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
      <div><label className="block text-sm font-medium mb-1">Contacto Emergencia</label><input type="text" name="emergency_contact_name" value={data.emergency_contact_name} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
      <div><label className="block text-sm font-medium mb-1">Teléfono Emergencia</label><input type="tel" name="emergency_contact_phone" value={data.emergency_contact_phone} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
    </div>
  );
};

const PassengersForm = ({ data, onChange }) => {
  const handleChange = (e) => onChange({ ...data, [e.target.name]: parseInt(e.target.value, 10) || 0 });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div><label className="block text-sm font-medium mb-1">Adultos (ADT)</label><input type="number" name="passengers_adt" value={data.passengers_adt} onChange={handleChange} min="0" className="w-full border rounded px-3 py-2" /></div>
      <div><label className="block text-sm font-medium mb-1">Niños (CHD)</label><input type="number" name="passengers_chd" value={data.passengers_chd} onChange={handleChange} min="0" className="w-full border rounded px-3 py-2" /></div>
      <div><label className="block text-sm font-medium mb-1">Infantes (INF)</label><input type="number" name="passengers_inf" value={data.passengers_inf} onChange={handleChange} min="0" className="w-full border rounded px-3 py-2" /></div>
    </div>
  );
};

const ItineraryForm = ({ data, onChange }) => {
  const handleSegmentChange = (index, e) => {
    const newSegments = [...(data || [])];
    newSegments[index] = { ...newSegments[index], [e.target.name]: e.target.value };
    onChange(newSegments);
  };
  const addSegment = () => onChange([...(data || []), { origin: '', destination: '', departure_date: getTodayDate(), return_date: getTodayDate() }]);
  const removeSegment = (index) => onChange((data || []).filter((_, i) => i !== index));

  return (
    <div className="space-y-4">
      {(data || []).map((segment, index) => (
        <div key={index} className="p-4 border rounded-lg relative bg-gray-50">
          <h5 className="font-bold text-gray-900 mb-3">Segmento {index + 1}</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Origen</label><input type="text" name="origin" value={segment.origin} onChange={(e) => handleSegmentChange(index, e)} className="w-full border rounded px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">Destino</label><input type="text" name="destination" value={segment.destination} onChange={(e) => handleSegmentChange(index, e)} className="w-full border rounded px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">Fecha Salida</label><input type="date" name="departure_date" value={segment.departure_date} onChange={(e) => handleSegmentChange(index, e)} className="w-full border rounded px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">Fecha Regreso</label><input type="date" name="return_date" value={segment.return_date} onChange={(e) => handleSegmentChange(index, e)} className="w-full border rounded px-3 py-2" /></div>
          </div>
          {(data || []).length > 1 && (
            <motion.button type="button" onClick={() => removeSegment(index)} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><MinusCircle className="w-5 h-5" /></motion.button>
          )}
        </div>
      ))}
      <motion.button type="button" onClick={addSegment} className="flex items-center gap-1 text-blue-600 font-medium" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><PlusCircle className="w-5 h-5" /> Agregar Segmento</motion.button>
    </div>
  );
};

// Formulario de Vuelos
const FlightsForm = ({ data, onChange }) => {
  const handleFlightChange = (index, field, value) => {
    const newFlights = [...(data || [])];
    newFlights[index] = { ...newFlights[index], [field]: value };
    onChange(newFlights);
  };

  const handleItineraryChange = (flightIndex, itineraryIndex, field, value) => {
    const newFlights = [...(data || [])];
    const newItineraries = [...(newFlights[flightIndex].reservation_flight_itineraries || [])];
    newItineraries[itineraryIndex] = { ...newItineraries[itineraryIndex], [field]: value };
    newFlights[flightIndex] = { ...newFlights[flightIndex], reservation_flight_itineraries: newItineraries };
    onChange(newFlights);
  };

  const addFlight = () => onChange([...(data || []), { airline: '', flight_category: '', baggage_allowance: '', flight_cycle: '', pnr: '', reservation_flight_itineraries: [] }]);
  const removeFlight = (index) => onChange((data || []).filter((_, i) => i !== index));
  const addItinerary = (flightIndex) => {
    const newFlights = [...(data || [])];
    const itineraries = newFlights[flightIndex].reservation_flight_itineraries || [];
    newFlights[flightIndex].reservation_flight_itineraries = [...itineraries, { flight_number: '', departure_time: '', arrival_time: '' }];
    onChange(newFlights);
  };
  const removeItinerary = (flightIndex, itineraryIndex) => {
    const newFlights = [...(data || [])];
    const itineraries = [...(newFlights[flightIndex].reservation_flight_itineraries || [])];
    itineraries.splice(itineraryIndex, 1);
    newFlights[flightIndex].reservation_flight_itineraries = itineraries;
    onChange(newFlights);
  };

  return (
    <div className="space-y-4">
      {(data || []).map((flight, index) => (
        <div key={index} className="p-4 border rounded-lg relative bg-gray-50">
          <h5 className="font-bold text-gray-900 mb-3">Vuelo {index + 1}</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Aerolínea</label>
              <AirlineInput
                value={flight.airline || ''}
                onSelect={(val) => handleFlightChange(index, 'airline', val)}
                placeholder="Buscar aerolínea"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categoría del Vuelo</label>
              <select
                value={flight.flight_category || ''}
                onChange={(e) => handleFlightChange(index, 'flight_category', e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Seleccionar</option>
                <option value="economica">Económica</option>
                <option value="premium_economica">Premium Económica</option>
                <option value="business">Business</option>
                <option value="primera_clase">Primera Clase</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Equipaje Permitido</label>
              <select
                value={flight.baggage_allowance || ''}
                onChange={(e) => handleFlightChange(index, 'baggage_allowance', e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Seleccionar</option>
                <option value="personal_item">Artículo Personal</option>
                <option value="carry_on">Equipaje de Mano</option>
                <option value="1_checked_bag">1 maleta facturada (23kg)</option>
                <option value="2_checked_bags">2 maletas facturadas (23kg c/u)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Código PNR</label>
              <input
                type="text"
                value={flight.pnr || ''}
                onChange={(e) => handleFlightChange(index, 'pnr', e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Código de reserva"
              />
            </div>
          </div>

          {/* Itinerarios */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <h6 className="text-sm font-semibold text-gray-700">Itinerarios</h6>
              <motion.button type="button" onClick={() => addItinerary(index)} className="text-xs text-blue-600" whileHover={{ scale: 1.05 }}><PlusCircle className="w-4 h-4 inline" /> Añadir</motion.button>
            </div>
            {(flight.reservation_flight_itineraries || []).map((itinerary, itIndex) => (
              <div key={itIndex} className="grid grid-cols-3 gap-2 items-end p-2 bg-white rounded relative">
                <div><label className="block text-xs font-medium mb-1">Nº Vuelo</label><input type="text" value={itinerary.flight_number || ''} onChange={(e) => handleItineraryChange(index, itIndex, 'flight_number', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" /></div>
                <div><label className="block text-xs font-medium mb-1">Salida</label><input type="datetime-local" value={itinerary.departure_time ? formatDate(itinerary.departure_time) + 'T' + itinerary.departure_time.split('T')[1]?.substring(0, 5) : ''} onChange={(e) => handleItineraryChange(index, itIndex, 'departure_time', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" /></div>
                <div><label className="block text-xs font-medium mb-1">Llegada</label><input type="datetime-local" value={itinerary.arrival_time ? formatDate(itinerary.arrival_time) + 'T' + itinerary.arrival_time.split('T')[1]?.substring(0, 5) : ''} onChange={(e) => handleItineraryChange(index, itIndex, 'arrival_time', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" /></div>
                {(flight.reservation_flight_itineraries || []).length > 1 && (
                  <motion.button type="button" onClick={() => removeItinerary(index, itIndex)} className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full" whileHover={{ scale: 1.1 }}><MinusCircle className="w-3 h-3" /></motion.button>
                )}
              </div>
            ))}
          </div>

          {(data || []).length > 1 && (
            <motion.button type="button" onClick={() => removeFlight(index)} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full" whileHover={{ scale: 1.1 }}><MinusCircle className="w-5 h-5" /></motion.button>
          )}
        </div>
      ))}
      <motion.button type="button" onClick={addFlight} className="flex items-center gap-1 text-blue-600 font-medium" whileHover={{ scale: 1.05 }}><PlusCircle className="w-5 h-5" /> Agregar Vuelo</motion.button>
    </div>
  );
};

// Formulario de Hoteles
const HotelsForm = ({ data, onChange }) => {
  const handleHotelChange = (index, field, value) => {
    const newHotels = [...(data || [])];
    newHotels[index] = { ...newHotels[index], [field]: value };
    onChange(newHotels);
  };

  const handleAccommodationChange = (hotelIndex, roomIndex, field, value) => {
    const newHotels = [...(data || [])];
    const newAccommodation = [...(newHotels[hotelIndex].reservation_hotel_accommodations || [])];
    newAccommodation[roomIndex] = { ...newAccommodation[roomIndex], [field]: parseInt(value) || 0 };
    newHotels[hotelIndex] = { ...newHotels[hotelIndex], reservation_hotel_accommodations: newAccommodation };
    onChange(newHotels);
  };

  const handleInclusionChange = (hotelIndex, inclusionIndex, value) => {
    const newHotels = [...(data || [])];
    const newInclusions = [...(newHotels[hotelIndex].reservation_hotel_inclusions || [])];
    newInclusions[inclusionIndex] = { ...newInclusions[inclusionIndex], inclusion: value };
    newHotels[hotelIndex] = { ...newHotels[hotelIndex], reservation_hotel_inclusions: newInclusions };
    onChange(newHotels);
  };

  const addHotel = () => onChange([...(data || []), { name: '', room_category: '', meal_plan: '', reservation_hotel_accommodations: [{ rooms: 1, adt: 0, chd: 0, inf: 0 }], reservation_hotel_inclusions: [{ inclusion: '' }] }]);
  const removeHotel = (index) => onChange((data || []).filter((_, i) => i !== index));
  const addAccommodation = (hotelIndex) => {
    const newHotels = [...(data || [])];
    const accommodations = newHotels[hotelIndex].reservation_hotel_accommodations || [];
    newHotels[hotelIndex].reservation_hotel_accommodations = [...accommodations, { rooms: 1, adt: 0, chd: 0, inf: 0 }];
    onChange(newHotels);
  };
  const removeAccommodation = (hotelIndex, roomIndex) => {
    const newHotels = [...(data || [])];
    const accommodations = [...(newHotels[hotelIndex].reservation_hotel_accommodations || [])];
    accommodations.splice(roomIndex, 1);
    newHotels[hotelIndex].reservation_hotel_accommodations = accommodations;
    onChange(newHotels);
  };
  const addInclusion = (hotelIndex) => {
    const newHotels = [...(data || [])];
    const inclusions = newHotels[hotelIndex].reservation_hotel_inclusions || [];
    newHotels[hotelIndex].reservation_hotel_inclusions = [...inclusions, { inclusion: '' }];
    onChange(newHotels);
  };
  const removeInclusion = (hotelIndex, inclusionIndex) => {
    const newHotels = [...(data || [])];
    const inclusions = [...(newHotels[hotelIndex].reservation_hotel_inclusions || [])];
    inclusions.splice(inclusionIndex, 1);
    newHotels[hotelIndex].reservation_hotel_inclusions = inclusions;
    onChange(newHotels);
  };

  return (
    <div className="space-y-4">
      {(data || []).map((hotel, index) => (
        <div key={index} className="p-4 border rounded-lg relative bg-gray-50">
          <h5 className="font-bold text-gray-900 mb-3">Hotel {index + 1}</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre del Hotel</label>
              <input type="text" value={hotel.name || ''} onChange={(e) => handleHotelChange(index, 'name', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categoría de Habitación</label>
              <input type="text" value={hotel.room_category || ''} onChange={(e) => handleHotelChange(index, 'room_category', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Plan de Comidas</label>
              <select value={hotel.meal_plan || ''} onChange={(e) => handleHotelChange(index, 'meal_plan', e.target.value)} className="w-full border rounded px-3 py-2">
                <option value="">Seleccionar</option>
                <option value="PE">PE: SOLO ALOJAMIENTO</option>
                <option value="PC">PC: SOLO DESAYUNO</option>
                <option value="PAM">PAM: DESAYUNO Y CENA</option>
                <option value="PA">PA: DESAYUNO, ALMUERZO Y CENA</option>
                <option value="FULL">FULL: TODO INCLUIDO</option>
              </select>
            </div>
          </div>

          {/* Acomodación */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <h6 className="text-sm font-semibold text-gray-700 flex items-center gap-1"><Bed className="w-4 h-4" /> Acomodación</h6>
              <motion.button type="button" onClick={() => addAccommodation(index)} className="text-xs text-blue-600" whileHover={{ scale: 1.05 }}><PlusCircle className="w-4 h-4 inline" /> Añadir</motion.button>
            </div>
            {(hotel.reservation_hotel_accommodations || []).map((room, roomIndex) => (
              <div key={roomIndex} className="grid grid-cols-4 gap-2 items-end p-2 bg-white rounded relative">
                <div><label className="block text-xs font-medium mb-1">Rooms</label><input type="number" value={room.rooms || 1} onChange={(e) => handleAccommodationChange(index, roomIndex, 'rooms', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" min="1" /></div>
                <div><label className="block text-xs font-medium mb-1">ADT</label><input type="number" value={room.adt || 0} onChange={(e) => handleAccommodationChange(index, roomIndex, 'adt', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" min="0" /></div>
                <div><label className="block text-xs font-medium mb-1">CHD</label><input type="number" value={room.chd || 0} onChange={(e) => handleAccommodationChange(index, roomIndex, 'chd', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" min="0" /></div>
                <div><label className="block text-xs font-medium mb-1">INF</label><input type="number" value={room.inf || 0} onChange={(e) => handleAccommodationChange(index, roomIndex, 'inf', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" min="0" /></div>
                {(hotel.reservation_hotel_accommodations || []).length > 1 && (
                  <motion.button type="button" onClick={() => removeAccommodation(index, roomIndex)} className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full" whileHover={{ scale: 1.1 }}><MinusCircle className="w-3 h-3" /></motion.button>
                )}
              </div>
            ))}
          </div>

          {/* Inclusiones */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <h6 className="text-sm font-semibold text-gray-700">Inclusiones</h6>
              <motion.button type="button" onClick={() => addInclusion(index)} className="text-xs text-blue-600" whileHover={{ scale: 1.05 }}><PlusCircle className="w-4 h-4 inline" /> Añadir</motion.button>
            </div>
            {(hotel.reservation_hotel_inclusions || []).map((inc, incIndex) => (
              <div key={incIndex} className="flex items-center gap-2 relative">
                <input type="text" value={inc.inclusion || ''} onChange={(e) => handleInclusionChange(index, incIndex, e.target.value)} className="w-full border rounded px-3 py-2 text-sm" placeholder="Ej: Wifi, Piscina..." />
                {(hotel.reservation_hotel_inclusions || []).length > 1 && (
                  <motion.button type="button" onClick={() => removeInclusion(index, incIndex)} className="p-1 bg-red-500 text-white rounded-full" whileHover={{ scale: 1.1 }}><MinusCircle className="w-3 h-3" /></motion.button>
                )}
              </div>
            ))}
          </div>

          {(data || []).length > 1 && (
            <motion.button type="button" onClick={() => removeHotel(index)} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full" whileHover={{ scale: 1.1 }}><MinusCircle className="w-5 h-5" /></motion.button>
          )}
        </div>
      ))}
      <motion.button type="button" onClick={addHotel} className="flex items-center gap-1 text-blue-600 font-medium" whileHover={{ scale: 1.05 }}><PlusCircle className="w-5 h-5" /> Agregar Hotel</motion.button>
    </div>
  );
};

// Formulario de Tours
const ToursForm = ({ data, onChange }) => {
  const handleTourChange = (index, field, value) => {
    const newTours = [...(data || [])];
    newTours[index] = { ...newTours[index], [field]: value };
    onChange(newTours);
  };

  const addTour = () => onChange([...(data || []), { name: '', date: getTodayDate(), cost: 0 }]);
  const removeTour = (index) => onChange((data || []).filter((_, i) => i !== index));

  return (
    <div className="space-y-4">
      {(data || []).map((tour, index) => (
        <div key={index} className="p-4 border rounded-lg relative bg-gray-50">
          <h5 className="font-bold text-gray-900 mb-3">Tour {index + 1}</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Nombre del Tour</label>
              <input type="text" value={tour.name || ''} onChange={(e) => handleTourChange(index, 'name', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha</label>
              <input type="date" value={formatDate(tour.date)} onChange={(e) => handleTourChange(index, 'date', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Costo</label>
              <input type="number" value={tour.cost || 0} onChange={(e) => handleTourChange(index, 'cost', parseFloat(e.target.value) || 0)} className="w-full border rounded px-3 py-2" min="0" />
            </div>
          </div>
          {(data || []).length > 1 && (
            <motion.button type="button" onClick={() => removeTour(index)} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full" whileHover={{ scale: 1.1 }}><MinusCircle className="w-5 h-5" /></motion.button>
          )}
        </div>
      ))}
      <motion.button type="button" onClick={addTour} className="flex items-center gap-1 text-blue-600 font-medium" whileHover={{ scale: 1.05 }}><PlusCircle className="w-5 h-5" /> Agregar Tour</motion.button>
    </div>
  );
};

// Formulario de Asistencias Médicas
const MedicalAssistancesForm = ({ data, onChange }) => {
  const handleChange = (index, field, value) => {
    const newData = [...(data || [])];
    newData[index] = { ...newData[index], [field]: value };
    onChange(newData);
  };

  const addAssistance = () => onChange([...(data || []), { plan_type: 'traditional_tourism', start_date: getTodayDate(), end_date: getTodayDate() }]);
  const removeAssistance = (index) => onChange((data || []).filter((_, i) => i !== index));

  return (
    <div className="space-y-4">
      {(data || []).map((ma, index) => (
        <div key={index} className="p-4 border rounded-lg relative bg-gray-50">
          <h5 className="font-bold text-gray-900 mb-3">Asistencia {index + 1}</h5>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Plan</label>
              <select value={ma.plan_type || 'traditional_tourism'} onChange={(e) => handleChange(index, 'plan_type', e.target.value)} className="w-full border rounded px-3 py-2">
                <option value="traditional_tourism">Turismo Tradicional</option>
                <option value="international_assistance">Asistencia Internacional</option>
                <option value="national_cancellation_insurance">Seguro de Cancelación Nacional</option>
                <option value="international_cancellation_insurance">Seguro de Cancelación Internacional</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fecha Inicio</label>
                <input type="date" value={formatDate(ma.start_date)} onChange={(e) => handleChange(index, 'start_date', e.target.value)} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha Fin</label>
                <input type="date" value={formatDate(ma.end_date)} onChange={(e) => handleChange(index, 'end_date', e.target.value)} className="w-full border rounded px-3 py-2" />
              </div>
            </div>
          </div>
          {(data || []).length > 1 && (
            <motion.button type="button" onClick={() => removeAssistance(index)} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full" whileHover={{ scale: 1.1 }}><MinusCircle className="w-5 h-5" /></motion.button>
          )}
        </div>
      ))}
      <motion.button type="button" onClick={addAssistance} className="flex items-center gap-1 text-blue-600 font-medium" whileHover={{ scale: 1.05 }}><PlusCircle className="w-5 h-5" /> Agregar Asistencia</motion.button>
    </div>
  );
};

// Formulario de Pago
const PaymentForm = ({ data, onChange }) => {
  const { formatCurrency } = useSettings();

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const handleInstallmentChange = (index, field, value) => {
    const newInstallments = [...(data.reservation_installments || [])];
    newInstallments[index] = { ...newInstallments[index], [field]: value };
    onChange({ ...data, reservation_installments: newInstallments });
  };

  const addInstallment = () => {
    const installments = data.reservation_installments || [];
    onChange({ ...data, reservation_installments: [...installments, { amount: 0, due_date: getTodayDate(), status: 'pending' }] });
  };

  const removeInstallment = (index) => {
    const installments = [...(data.reservation_installments || [])];
    installments.splice(index, 1);
    onChange({ ...data, reservation_installments: installments });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Precio por ADT</label>
          <input type="number" value={data.price_per_adt || 0} onChange={(e) => handleChange('price_per_adt', parseFloat(e.target.value) || 0)} className="w-full border rounded px-3 py-2" min="0" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Precio por CHD</label>
          <input type="number" value={data.price_per_chd || 0} onChange={(e) => handleChange('price_per_chd', parseFloat(e.target.value) || 0)} className="w-full border rounded px-3 py-2" min="0" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Precio por INF</label>
          <input type="number" value={data.price_per_inf || 0} onChange={(e) => handleChange('price_per_inf', parseFloat(e.target.value) || 0)} className="w-full border rounded px-3 py-2" min="0" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Monto Total</label>
        <input type="number" value={data.total_amount || 0} onChange={(e) => handleChange('total_amount', parseFloat(e.target.value) || 0)} className="w-full border rounded px-3 py-2" min="0" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Opción de Pago</label>
        <select value={data.payment_option || 'full_payment'} onChange={(e) => handleChange('payment_option', e.target.value)} className="w-full border rounded px-3 py-2">
          <option value="full_payment">Pago Total</option>
          <option value="installments">Pago a Cuotas</option>
        </select>
      </div>

      {data.payment_option === 'installments' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h6 className="text-sm font-semibold text-gray-700 flex items-center gap-1"><List className="w-4 h-4" /> Cuotas</h6>
            <motion.button type="button" onClick={addInstallment} className="text-xs text-blue-600" whileHover={{ scale: 1.05 }}><PlusCircle className="w-4 h-4 inline" /> Añadir</motion.button>
          </div>
          {(data.reservation_installments || []).map((installment, index) => (
            <div key={index} className="grid grid-cols-2 gap-2 items-end p-2 bg-gray-100 rounded relative">
              <div>
                <label className="block text-xs font-medium mb-1">Monto</label>
                <input type="number" value={installment.amount || 0} onChange={(e) => handleInstallmentChange(index, 'amount', parseFloat(e.target.value) || 0)} className="w-full border rounded px-2 py-1 text-sm" min="0" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Fecha Vencimiento</label>
                <input type="date" value={formatDate(installment.due_date)} onChange={(e) => handleInstallmentChange(index, 'due_date', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
              </div>
              {(data.reservation_installments || []).length > 1 && (
                <motion.button type="button" onClick={() => removeInstallment(index)} className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full" whileHover={{ scale: 1.1 }}><MinusCircle className="w-3 h-3" /></motion.button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Formulario de Traslados
const TransfersForm = ({ data, onChange }) => {
  const handleTransferChange = (segmentIndex, transferType, field, value) => {
    const newData = { ...(data || {}) };
    if (!newData[segmentIndex]) {
      newData[segmentIndex] = { hasIn: false, hasOut: false };
    }

    if (field === 'hasIn' || field === 'hasOut') {
      newData[segmentIndex][field] = value;
    }

    onChange(newData);
  };

  // Obtener segmentos de la reserva (asumimos que se pasan junto con data)
  const segments = data?.segments || [];

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Indica si la reserva incluye traslados de llegada (IN) y/o salida (OUT) para cada segmento del viaje.
        </p>
      </div>

      {segments.length > 0 ? (
        segments.map((segment, index) => (
          <div key={index} className="p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
            <h5 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Segmento {index + 1}: {segment.origin || '...'} → {segment.destination || '...'}
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white">
                <input
                  type="checkbox"
                  id={`transfer-in-${index}`}
                  checked={data?.[index]?.hasIn || false}
                  onChange={(e) => handleTransferChange(index, 'in', 'hasIn', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <label htmlFor={`transfer-in-${index}`} className="flex items-center gap-2 cursor-pointer font-medium text-gray-700 flex-1">
                  <PlaneLanding className="w-5 h-5 text-green-600" />
                  Traslado de Llegada (IN)
                </label>
              </div>
              <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white">
                <input
                  type="checkbox"
                  id={`transfer-out-${index}`}
                  checked={data?.[index]?.hasOut || false}
                  onChange={(e) => handleTransferChange(index, 'out', 'hasOut', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <label htmlFor={`transfer-out-${index}`} className="flex items-center gap-2 cursor-pointer font-medium text-gray-700 flex-1">
                  <PlaneTakeoff className="w-5 h-5 text-blue-600" />
                  Traslado de Salida (OUT)
                </label>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Car className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No hay segmentos disponibles para configurar traslados.</p>
        </div>
      )}
    </div>
  );
};

// Formulario de Cancelación de Reserva
const CancellationForm = ({ data, onChange }) => {
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleChange = (field, value) => {
    onChange({ ...(data || {}), [field]: value });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar que sea un PDF
    if (file.type !== 'application/pdf') {
      alert('Solo se permiten archivos PDF');
      return;
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo no debe superar los 5MB');
      return;
    }

    setUploadingFile(true);

    try {
      // Aquí iría la lógica de subida a Supabase Storage o servidor
      // Por ahora, simulamos con un timeout
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Crear objeto URL temporal para previsualización
      const fileUrl = URL.createObjectURL(file);

      handleChange('cancellation_letter', {
        file_name: file.name,
        file_url: fileUrl,
        file_size: file.size,
        uploaded_at: new Date().toISOString()
      });

      alert('Carta cargada exitosamente');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error al cargar el archivo');
    } finally {
      setUploadingFile(false);
    }
  };

  const removeFile = () => {
    handleChange('cancellation_letter', null);
  };

  return (
    <div className="space-y-6">
      {/* Advertencia */}
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h6 className="font-bold text-red-900 mb-2">Solicitud de Cancelación de Reserva</h6>
            <p className="text-sm text-red-800 mb-2">
              Esta solicitud requiere la aprobación del gestor o administrador. Una vez aprobada, la reserva será cancelada de forma permanente.
            </p>
            <p className="text-sm text-red-800 font-semibold">
              ⚠️ Esta acción no se puede deshacer después de ser aprobada.
            </p>
          </div>
        </div>
      </div>

      {/* Motivo de Cancelación */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Motivo de la Cancelación <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data?.cancellation_reason || ''}
          onChange={(e) => handleChange('cancellation_reason', e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          placeholder="Explica detalladamente el motivo de la cancelación..."
          required
        />
        <p className="text-xs text-gray-500 mt-1">Mínimo 20 caracteres</p>
      </div>

      {/* Carta Firmada por el Cliente */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Carta Firmada por el Cliente <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-600 mb-3">
          Sube la carta firmada por el cliente solicitando formalmente la cancelación de la reserva (formato PDF, máx. 5MB)
        </p>

        {!data?.cancellation_letter ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              id="cancellation-letter-upload"
              accept="application/pdf"
              onChange={handleFileUpload}
              disabled={uploadingFile}
              className="hidden"
            />
            <label
              htmlFor="cancellation-letter-upload"
              className="cursor-pointer flex flex-col items-center gap-3"
            >
              {uploadingFile ? (
                <>
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-600">Subiendo archivo...</p>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Haz clic para subir la carta</p>
                    <p className="text-xs text-gray-500">o arrastra el archivo aquí</p>
                  </div>
                  <motion.button
                    type="button"
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Seleccionar Archivo PDF
                  </motion.button>
                </>
              )}
            </label>
          </div>
        ) : (
          <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">{data.cancellation_letter.file_name}</p>
                  <p className="text-xs text-gray-600">
                    {(data.cancellation_letter.file_size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <motion.button
                type="button"
                onClick={removeFile}
                className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Información Adicional */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h6 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Información Importante
        </h6>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>La carta debe estar firmada por el titular de la reserva</li>
          <li>Debe incluir datos de la reserva (número de factura, fechas, destino)</li>
          <li>El gestor revisará y aprobará/rechazará la solicitud</li>
          <li>Recibirás una notificación con la respuesta</li>
        </ul>
      </div>
    </div>
  );
};

const ChangeRequestModal = ({ reservation, onClose }) => {

  // Defensive check
  if (!reservation) {
    return null;
  }

  const { currentUser: user } = useAuth();
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sections = useMemo(() => [
    { id: 'client', label: 'Información del Titular', icon: User, isPresent: !!reservation.clients, description: 'Modificar datos del cliente principal.' },
    { id: 'passengers', label: 'Cantidad de Pasajeros', icon: Users, isPresent: true, description: 'Ajustar el número de adultos, niños e infantes.' },
    { id: 'itinerary', label: 'Detalles del Itinerario', icon: Globe, isPresent: reservation.reservation_segments?.length > 0, description: 'Cambiar orígenes, destinos y fechas de los segmentos.' },
    { id: 'flights', label: 'Detalles de Vuelos', icon: Plane, isPresent: reservation.reservation_flights?.length > 0, description: 'Editar información de aerolíneas, equipaje, etc.' },
    { id: 'hotels', label: 'Detalles de Hoteles', icon: Hotel, isPresent: reservation.reservation_hotels?.length > 0, description: 'Modificar hoteles, habitaciones o planes de comida.' },
    { id: 'tours', label: 'Tours y Actividades', icon: Ticket, isPresent: reservation.reservation_tours?.length > 0, description: 'Añadir, eliminar o cambiar tours contratados.' },
    { id: 'medicalAssistances', label: 'Asistencias Médicas', icon: BriefcaseMedical, isPresent: reservation.reservation_medical_assistances?.length > 0, description: 'Ajustar planes o fechas de cobertura médica.' },
    { id: 'payment', label: 'Detalles de Pago', icon: Euro, isPresent: true, description: 'Cambiar precios, forma de pago o plan de cuotas.' },
    { id: 'transfers', label: 'Traslados IN/OUT', icon: Car, isPresent: reservation.reservation_segments?.length > 0, description: 'Configurar traslados de llegada y salida por segmento.' },
    { id: 'cancellation', label: 'Cancelación de Reserva', icon: XCircle, isPresent: true, description: 'Solicitar cancelación formal de la reserva con carta firmada.', isSpecial: true },
  ], [reservation]);

  const getSectionData = (sectionId) => {
    switch (sectionId) {
      case 'client':
        return { ...reservation.clients };
      case 'passengers':
        return {
          passengers_adt: reservation.passengers_adt,
          passengers_chd: reservation.passengers_chd,
          passengers_inf: reservation.passengers_inf
        };
      case 'itinerary':
        return [...(reservation.reservation_segments || [])];
      case 'flights':
        return [...(reservation.reservation_flights || [])];
      case 'hotels':
        return [...(reservation.reservation_hotels || [])];
      case 'tours':
        return [...(reservation.reservation_tours || [])];
      case 'medicalAssistances':
        return [...(reservation.reservation_medical_assistances || [])];
      case 'payment':
        return {
          price_per_adt: reservation.price_per_adt,
          price_per_chd: reservation.price_per_chd,
          price_per_inf: reservation.price_per_inf,
          total_amount: reservation.total_amount,
          payment_option: reservation.payment_option,
          reservation_installments: [...(reservation.reservation_installments || [])]
        };
      case 'transfers':
        // Convertir traslados a formato esperado por el formulario
        const transfersBySegment = {};
        (reservation.reservation_transfers || []).forEach(t => {
          const segIdx = (reservation.reservation_segments || []).findIndex(s => s.id === t.segment_id);
          if (segIdx !== -1) {
            if (!transfersBySegment[segIdx]) {
              transfersBySegment[segIdx] = { hasIn: false, hasOut: false };
            }
            if (t.transfer_type === 'arrival') transfersBySegment[segIdx].hasIn = true;
            if (t.transfer_type === 'departure') transfersBySegment[segIdx].hasOut = true;
          }
        });
        return {
          ...transfersBySegment,
          segments: [...(reservation.reservation_segments || [])]
        };
      case 'cancellation':
        return {
          cancellation_reason: '',
          cancellation_letter: null
        };
      default:
        return {};
    }
  };

  const handleSelectSection = (sectionId) => {
    const data = getSectionData(sectionId);
    setFormData(data);
    setOriginalData(data);
    setEditingSection(sectionId);
  };

  const handleBack = () => {
    setEditingSection(null);
    setFormData(null);
    setOriginalData(null);
    setReason('');
  };

  const hasChanges = useMemo(() => {
    if (!originalData || !formData) return false;
    return JSON.stringify(originalData) !== JSON.stringify(formData);
  }, [originalData, formData]);

  const handleSubmit = async () => {
    // Validaciones específicas para cancelación
    if (editingSection === 'cancellation') {
      if (!formData.cancellation_reason || formData.cancellation_reason.trim().length < 20) {
        alert('El motivo de cancelación debe tener al menos 20 caracteres.');
        return;
      }
      if (!formData.cancellation_letter) {
        alert('Debes subir la carta firmada por el cliente.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await fetch(`http://localhost:4000/api/reservations/${reservation.id}/change-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: editingSection, changes: formData, reason, userId: user?.id })
      });

      const message = editingSection === 'cancellation'
        ? 'Solicitud de cancelación enviada con éxito. Recibirás una notificación cuando sea revisada.'
        : 'Solicitud de cambio enviada con éxito.';

      alert(message);
      onClose();
    } catch (error) {
      console.error('Error sending change request:', error);
      alert('Error al enviar la solicitud de cambio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSectionForm = () => {
    if (!editingSection) return null;
    switch (editingSection) {
      case 'client':
        return <ClientForm data={formData} onChange={setFormData} />;
      case 'passengers':
        return <PassengersForm data={formData} onChange={setFormData} />;
      case 'itinerary':
        return <ItineraryForm data={formData} onChange={setFormData} />;
      case 'flights':
        return <FlightsForm data={formData} onChange={setFormData} />;
      case 'hotels':
        return <HotelsForm data={formData} onChange={setFormData} />;
      case 'tours':
        return <ToursForm data={formData} onChange={setFormData} />;
      case 'medicalAssistances':
        return <MedicalAssistancesForm data={formData} onChange={setFormData} />;
      case 'payment':
        return <PaymentForm data={formData} onChange={setFormData} />;
      case 'transfers':
        return <TransfersForm data={formData} onChange={setFormData} />;
      case 'cancellation':
        return <CancellationForm data={formData} onChange={setFormData} />;
      default:
        return <p className="text-center text-gray-500 p-8">El formulario para esta sección aún no ha sido implementado.</p>;
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="p-6">
          <AnimatePresence mode="wait">
            {editingSection ? (
              <motion.div key="form">
                <SectionForm onBack={handleBack} title={`Editar ${sections.find(s => s.id === editingSection)?.label}`}>
                  {renderSectionForm()}
                </SectionForm>
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motivo del cambio</label>
                    <textarea
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      rows={3}
                      className="w-full border rounded px-3 py-2"
                      placeholder="Explica brevemente por qué se necesita este cambio..."
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <motion.button onClick={onClose} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Cancelar
                    </motion.button>
                    <motion.button
                      onClick={handleSubmit}
                      disabled={!hasChanges || !reason || isSubmitting}
                      className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    >
                      <Save className="w-5 h-5" />
                      {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="selection" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Solicitud de Cambio</h2>
                  <motion.button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <X className="w-6 h-6" />
                  </motion.button>
                </div>
                <p className="text-center text-gray-600 mb-8">Selecciona la sección de la reserva que deseas modificar.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sections.filter(s => s.isPresent).map(section => {
                    const Icon = section.icon;
                    const isSpecial = section.isSpecial;
                    return (
                      <motion.button
                        key={section.id}
                        onClick={() => handleSelectSection(section.id)}
                        className={`text-left p-4 rounded-xl border transition-all duration-200 group ${
                          isSpecial
                            ? 'bg-red-50 border-red-300 hover:bg-red-100 hover:border-red-400'
                            : 'bg-gray-50 hover:bg-blue-50 hover:border-blue-300'
                        }`}
                        whileHover={{ scale: 1.03, y: -5 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSpecial
                              ? 'bg-gradient-to-br from-red-100 to-red-200'
                              : 'bg-gradient-to-br from-blue-100 to-purple-100'
                          }`}>
                            <Icon className={`w-5 h-5 ${isSpecial ? 'text-red-600' : 'text-blue-600'}`} />
                          </div>
                          <h3 className={`text-md font-semibold ${
                            isSpecial
                              ? 'text-red-900 group-hover:text-red-800'
                              : 'text-gray-800 group-hover:text-blue-800'
                          }`}>
                            {section.label}
                          </h3>
                        </div>
                        <p className={`text-sm mt-2 ${isSpecial ? 'text-red-700' : 'text-gray-500'}`}>
                          {section.description}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ChangeRequestModal;