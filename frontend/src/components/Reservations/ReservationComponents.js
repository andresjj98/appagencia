import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Hotel,
  Plane,
  Car,
  BriefcaseMedical,
  Ticket,
  X,
  Bed,
  Info,
  PlusCircle,
  MinusCircle,
  Calendar,
  Users,  
  Minimize2, // For minimize icon
  Maximize2 // For maximize icon
} from 'lucide-react';
import { useSettings } from '../../utils/SettingsContext';

// Hotel Component
const HotelComponent = ({ data, onChange, onDelete }) => {
  const [isMinimized, setIsMinimized] = useState(false);

  const handleAccommodationChange = (index, e) => {
    const { name, value } = e.target;
    const newAccommodation = [...(data.accommodation || [{ rooms: 1, adt: 0, chd: 0, inf: 0 }])];
    newAccommodation[index] = { ...newAccommodation[index], [name]: parseInt(value) || 0 };
    onChange('hotel', { ...data, accommodation: newAccommodation });
  };

  const addAccommodationRoom = () => {
    onChange('hotel', { ...data, accommodation: [...(data.accommodation || []), { rooms: 1, adt: 0, chd: 0, inf: 0 }] });
  };

  const removeAccommodationRoom = (index) => {
    const newAccommodation = [...(data.accommodation || [])];
    newAccommodation.splice(index, 1);
    onChange('hotel', { ...data, accommodation: newAccommodation });
  };

  const handleHotelInclusionChange = (index, e) => {
    const newHotelInclusions = [...(data.hotelInclusions || [''])];
    newHotelInclusions[index] = e.target.value;
    onChange('hotel', { ...data, hotelInclusions: newHotelInclusions });
  };

  const addHotelInclusion = () => {
    onChange('hotel', { ...data, hotelInclusions: [...(data.hotelInclusions || []), ''] });
  };

  const removeHotelInclusion = (index) => {
    const newHotelInclusions = [...(data.hotelInclusions || [])];
    newHotelInclusions.splice(index, 1);
    onChange('hotel', { ...data, hotelInclusions: newHotelInclusions });
  };

  return (
    <motion.div 
      className="bg-white p-6 rounded-lg shadow-md border border-gray-200 relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Hotel className="w-6 h-6 text-blue-600" /> Detalles del Hotel
        </h4>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </motion.button>
          <motion.button
            onClick={onDelete}
            className="p-1 bg-red-500 text-white rounded-full shadow-md"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
      
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Hotel</label>
                <input type="text" name="name" value={data.name || ''} onChange={(e) => onChange('hotel', { ...data, name: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ej: Hotel Gran Via" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría de Habitación</label>
                <input type="text" name="roomCategory" value={data.roomCategory || ''} onChange={(e) => onChange('hotel', { ...data, roomCategory: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ej: Doble Estándar, Suite" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <Bed className="w-4 h-4" /> Acomodación
                  </h5>
                  <motion.button type="button" onClick={addAccommodationRoom} className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <PlusCircle className="w-4 h-4" /> Añadir Habitación
                  </motion.button>
                </div>
                {(data.accommodation || []).map((room, roomIndex) => (
                  <div key={roomIndex} className="grid grid-cols-4 gap-2 items-end relative p-2 bg-gray-100 rounded-lg">
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Habitaciones</label><input type="number" name="rooms" value={room.rooms} onChange={(e) => handleAccommodationChange(roomIndex, e)} min="1" className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">ADT</label><input type="number" name="adt" value={room.adt} onChange={(e) => handleAccommodationChange(roomIndex, e)} min="0" className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">CHD</label><input type="number" name="chd" value={room.chd} onChange={(e) => handleAccommodationChange(roomIndex, e)} min="0" className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">INF</label><input type="number" name="inf" value={room.inf} onChange={(e) => handleAccommodationChange(roomIndex, e)} min="0" className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" /></div>
                    {(data.accommodation || []).length > 1 && (
                      <motion.button type="button" onClick={() => removeAccommodationRoom(roomIndex)} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <MinusCircle className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Alimentación</label>
                <select name="mealPlan" value={data.mealPlan || ''} onChange={(e) => onChange('hotel', { ...data, mealPlan: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                  <option value="">Seleccionar</option><option value="solo_alojamiento">Solo Alojamiento (SA)</option><option value="desayuno">Desayuno (AD)</option><option value="media_pension">Media Pensión (MP)</option><option value="pension_completa">Pensión Completa (PC)</option><option value="todo_incluido">Todo Incluido (TI)</option>
                </select>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <Info className="w-4 h-4" /> Inclusiones del Hotel
                  </h5>
                  <motion.button type="button" onClick={addHotelInclusion} className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <PlusCircle className="w-4 h-4" /> Añadir Inclusión
                  </motion.button>
                </div>
                {(data.hotelInclusions || []).map((inclusion, inclusionIndex) => (
                  <div key={inclusionIndex} className="flex items-center gap-2 relative">
                    <input type="text" value={inclusion} onChange={(e) => handleHotelInclusionChange(inclusionIndex, e)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ej: Wifi, Piscina, Gimnasio..." />
                    {(data.hotelInclusions || []).length > 1 && (
                      <motion.button type="button" onClick={() => removeHotelInclusion(inclusionIndex)} className="p-1 bg-red-500 text-white rounded-full shadow-md" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <MinusCircle className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Flight Component
const FlightComponent = ({ data, onChange, onDelete }) => {
  return (
    <motion.div 
      className="bg-white p-6 rounded-lg shadow-md border border-gray-200 relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Plane className="w-6 h-6 text-purple-600" /> Detalles del Vuelo
      </h4>
      <motion.button
        onClick={onDelete}
        className="absolute top-4 right-4 p-1 bg-red-500 text-white rounded-full shadow-md"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <X className="w-4 h-4" />
      </motion.button>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Aerolínea</label>
          <input type="text" name="airline" value={data.airline || ''} onChange={(e) => onChange('flight', { ...data, airline: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ej: Iberia" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Categoría del Vuelo</label>
          <select name="flightCategory" value={data.flightCategory || ''} onChange={(e) => onChange('flight', { ...data, flightCategory: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
            <option value="">Seleccionar</option><option value="economica">Económica</option><option value="premium_economica">Premium Económica</option><option value="business">Business</option><option value="primera_clase">Primera Clase</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Equipaje Permitido</label>
          <input type="text" name="baggageAllowance" value={data.baggageAllowance || ''} onChange={(e) => onChange('flight', { ...data, baggageAllowance: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ej: 1 maleta de 23kg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Itinerario del Vuelo</label>
          <textarea name="itinerary" value={data.itinerary || ''} onChange={(e) => onChange('flight', { ...data, itinerary: e.target.value })} rows={2} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Detalles del itinerario" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Código de Rastreo (PNR)</label>
          <input type="text" name="trackingCode" value={data.trackingCode || ''} onChange={(e) => onChange('flight', { ...data, trackingCode: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="PNR" />
        </div>
      </div>
    </motion.div>
  );
};

// Ground Transport Component
const GroundTransportComponent = ({ data, onChange, onDelete }) => {
  return (
    <motion.div 
      className="bg-white p-6 rounded-lg shadow-md border border-gray-200 relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Car className="w-6 h-6 text-orange-600" /> Detalles del Transporte Terrestre
      </h4>
      <motion.button
        onClick={onDelete}
        className="absolute top-4 right-4 p-1 bg-red-500 text-white rounded-full shadow-md"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <X className="w-4 h-4" />
      </motion.button>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Transporte</label>
          <select name="type" value={data.type || ''} onChange={(e) => onChange('groundTransport', { ...data, type: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
            <option value="">Seleccionar</option><option value="bus">Autobús</option><option value="train">Tren</option><option value="private_car">Coche Privado</option><option value="ferry">Ferry</option><option value="other">Otro</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Compañía</label>
          <input type="text" name="company" value={data.company || ''} onChange={(e) => onChange('groundTransport', { ...data, company: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ej: Renfe, Flixbus" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Detalles Adicionales</label>
          <textarea name="details" value={data.details || ''} onChange={(e) => onChange('groundTransport', { ...data, details: e.target.value })} rows={2} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Horarios, puntos de encuentro, etc." />
        </div>
      </div>
    </motion.div>
  );
};

// Medical Assistance Component
const MedicalAssistanceComponent = ({ data, onChange, onDelete }) => {
  return (
    <motion.div 
      className="bg-white p-6 rounded-lg shadow-md border border-gray-200 relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <BriefcaseMedical className="w-6 h-6 text-green-600" /> Asistencia Médica
      </h4>
      <motion.button
        onClick={onDelete}
        className="absolute top-4 right-4 p-1 bg-red-500 text-white rounded-full shadow-md"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <X className="w-4 h-4" />
      </motion.button>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Plan</label>
          <input type="text" name="planName" value={data.planName || ''} onChange={(e) => onChange('medicalAssistance', { ...data, planName: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ej: Plan Básico, Plan Premium" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Compañía</label>
          <input type="text" name="company" value={data.company || ''} onChange={(e) => onChange('medicalAssistance', { ...data, company: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ej: Assist Card" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Costo ($)</label>
          <input type="number" name="cost" value={data.cost || ''} onChange={(e) => onChange('medicalAssistance', { ...data, cost: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="0.00" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Detalles de Cobertura</label>
          <textarea name="coverageDetails" value={data.coverageDetails || ''} onChange={(e) => onChange('medicalAssistance', { ...data, coverageDetails: e.target.value })} rows={2} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Descripción de la cobertura" />
        </div>
      </div>
    </motion.div>
  );
};

// Tours Component
const ToursComponent = ({ data, onChange, onDelete }) => {
  const { formatCurrency } = useSettings();
  const handleTourChange = (index, e) => {
    const { name, value } = e.target;
    const newTours = [...(data.tours || [{ name: '', date: '', cost: 0 }])];
    newTours[index] = { ...newTours[index], [name]: name === 'cost' ? parseFloat(value) || 0 : value };
    onChange('tours', { ...data, tours: newTours });
  };

  const addTour = () => {
    onChange('tours', { ...data, tours: [...(data.tours || []), { name: '', date: '', cost: 0 }] });
  };

  const removeTour = (index) => {
    const newTours = [...(data.tours || [])];
    newTours.splice(index, 1);
    onChange('tours', { ...data, tours: newTours });
  };

    const totalToursCost = (data.tours || []).reduce((sum, tour) => sum + (tour.cost || 0), 0);

  return (
    <motion.div 
      className="bg-white p-6 rounded-lg shadow-md border border-gray-200 relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Ticket className="w-6 h-6 text-pink-600" /> Tours y Actividades
      </h4>
      <motion.button
        onClick={onDelete}
        className="absolute top-4 right-4 p-1 bg-red-500 text-white rounded-full shadow-md"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <X className="w-4 h-4" />
      </motion.button>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
            <List className="w-4 h-4" /> Lista de Tours
          </h5>
          <motion.button type="button" onClick={addTour} className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <PlusCircle className="w-4 h-4" /> Añadir Tour
          </motion.button>
        </div>
        {(data.tours || []).map((tour, tourIndex) => (
          <div key={tourIndex} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end relative p-3 bg-gray-100 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del Tour</label>
              <input type="text" name="name" value={tour.name} onChange={(e) => handleTourChange(tourIndex, e)} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" placeholder="Ej: Tour por la ciudad" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
              <input type="date" name="date" value={tour.date} onChange={(e) => handleTourChange(tourIndex, e)} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Costo ($)</label>
              <input type="number" name="cost" value={tour.cost} onChange={(e) => handleTourChange(tourIndex, e)} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" placeholder="0.00" />
            </div>
            {(data.tours || []).length > 1 && (
              <motion.button type="button" onClick={() => removeTour(tourIndex)} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <MinusCircle className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        ))}
        <p className="text-sm font-semibold text-gray-800 mt-4">Costo Total de Tours: {formatCurrency(totalToursCost)}</p>
      </div>
    </motion.div>
  );
};


const componentMap = {
  hotel: HotelComponent,
  flight: FlightComponent,
  groundTransport: GroundTransportComponent,
  medicalAssistance: MedicalAssistanceComponent,
  tours: ToursComponent,
};

export const renderComponent = (type, data, onChange, onDelete) => {
  const Component = componentMap[type];
  if (!Component) return null;
  return <Component data={data} onChange={onChange} onDelete={onDelete} />;
};

export const componentTypes = [
  { id: 'hotel', label: 'Hotel', icon: Hotel },
  { id: 'flight', label: 'Vuelo', icon: Plane },
  { id: 'groundTransport', label: 'Transporte Terrestre', icon: Car },
  { id: 'medicalAssistance', label: 'Asistencia Médica', icon: BriefcaseMedical },
  { id: 'tours', label: 'Tours', icon: Ticket },
];